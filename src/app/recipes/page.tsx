"use client"

import Link from "next/link"
import { useSession } from "@/lib/auth-client"
import { buttonVariants } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { useEffect, useState, useMemo } from "react"
import { toast } from "sonner"
import { Skeleton } from "@/components/ui/skeleton"
import { RecipeFilters } from "@/components/recipes/RecipeFilters"
import { RecipeListDisplay } from "@/components/recipes/RecipeListDisplay"
import type { SelectableItem } from "@/components/ui/multi-select"
import type {
  Category,
  Allergy,
  Difficulty,
  RecipeClient,
} from "@/lib/types/database"
import { useDebouncedCallback } from "use-debounce"
import { useSearchParams, useRouter } from "next/navigation"

export default function RecipesPage() {
  const { data: sessionData, isPending: isSessionLoading } = useSession()
  const session = sessionData?.session
  const searchParams = useSearchParams()
  const router = useRouter()
  const [filteredRecipes, setFilteredRecipes] = useState<RecipeClient[]>([])
  const [isLoadingRecipes, setIsLoadingRecipes] = useState(true)
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const [isFiltering, setIsFiltering] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState<
    | {
        currentPage: number
        totalPages: number
        totalCount: number
        hasMore: boolean
      }
    | undefined
  >(undefined)

  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([])
  const [selectedAllergyIds, setSelectedAllergyIds] = useState<string[]>([])
  const [selectedDifficultyIds, setSelectedDifficultyIds] = useState<string[]>(
    [],
  )
  const [isVegan, setIsVegan] = useState(false)
  const [isVegetarian, setIsVegetarian] = useState(false)
  const [ingredientSearch, setIngredientSearch] = useState("")
  const [maxPrepTime, setMaxPrepTime] = useState<string>("")
  const [minServings, setMinServings] = useState<string>("")

  const [allCategories, setAllCategories] = useState<SelectableItem[]>([])
  const [isLoadingCategories, setIsLoadingCategories] = useState(true)
  const [allAllergies, setAllAllergies] = useState<SelectableItem[]>([])
  const [isLoadingAllergies, setIsLoadingAllergies] = useState(true)
  const [allDifficulties, setAllDifficulties] = useState<SelectableItem[]>([])
  const [isLoadingDifficulties, setIsLoadingDifficulties] = useState(true)

  useEffect(() => {
    const urlSearch = searchParams.get("search") || ""
    const urlCategoryIds =
      searchParams.get("categoryIds")?.split(",").filter(Boolean) || []
    const urlAllergyIds =
      searchParams.get("allergyIds")?.split(",").filter(Boolean) || []
    const urlDifficultyIds =
      searchParams.get("difficultyIds")?.split(",").filter(Boolean) || []
    const urlIsVegan = searchParams.get("isVegan") === "true"
    const urlIsVegetarian = searchParams.get("isVegetarian") === "true"
    const urlIngredientSearch = searchParams.get("ingredientSearch") || ""
    const urlMaxPrepTime = searchParams.get("maxPrepTime") || ""
    const urlMinServings = searchParams.get("minServings") || ""

    const hasUrlParams =
      urlSearch ||
      urlCategoryIds.length > 0 ||
      urlAllergyIds.length > 0 ||
      urlDifficultyIds.length > 0 ||
      urlIsVegan ||
      urlIsVegetarian ||
      urlIngredientSearch ||
      urlMaxPrepTime ||
      urlMinServings

    if (hasUrlParams) {
      setSearchTerm(urlSearch)
      setSelectedCategoryIds(urlCategoryIds)
      setSelectedAllergyIds(urlAllergyIds)
      setSelectedDifficultyIds(urlDifficultyIds)
      setIsVegan(urlIsVegan)
      setIsVegetarian(urlIsVegetarian)
      setIngredientSearch(urlIngredientSearch)
      setMaxPrepTime(urlMaxPrepTime)
      setMinServings(urlMinServings)

      router.replace("/recipes", { scroll: false })
    }
  }, [searchParams, router])
  const debouncedFetchRecipes = useDebouncedCallback(
    async (
      search: string,
      categoryIds: string[],
      allergyIds: string[],
      difficultyIds: string[],
      isVegan: boolean,
      isVegetarian: boolean,
      ingredientSearch: string,
      maxPrepTime: string,
      minServings: string,
      page: number = 1,
      resetResults: boolean = true,
    ) => {
      try {
        if (isInitialLoad || resetResults) {
          setIsLoadingRecipes(true)
          setCurrentPage(1)
        } else {
          setIsFiltering(true)
        }

        if (page > 1) {
          setIsLoadingMore(true)
        }

        const params = new URLSearchParams()

        if (search.trim()) {
          params.append("search", search.trim())
        }
        if (categoryIds.length > 0) {
          params.append("categoryIds", categoryIds.join(","))
        }
        if (allergyIds.length > 0) {
          params.append("allergyIds", allergyIds.join(","))
        }
        if (difficultyIds.length > 0) {
          params.append("difficultyIds", difficultyIds.join(","))
        }
        if (isVegan) {
          params.append("isVegan", "true")
        }
        if (isVegetarian) {
          params.append("isVegetarian", "true")
        }
        if (ingredientSearch.trim()) {
          params.append("ingredientSearch", ingredientSearch.trim())
        }
        if (maxPrepTime && parseInt(maxPrepTime, 10) > 0) {
          params.append("maxPrepTime", maxPrepTime)
        }
        if (minServings && parseInt(minServings, 10) > 0) {
          params.append("minServings", minServings)
        }
        params.append("page", page.toString())
        params.append("limit", "20")

        const url = `/api/recipes${
          params.toString() ? `?${params.toString()}` : ""
        }`
        const res = await fetch(url)
        if (!res.ok) {
          throw new Error("Failed to fetch recipes")
        }
        const data = await res.json()

        if (resetResults || page === 1) {
          setFilteredRecipes(data.recipes || data)
        } else {
          setFilteredRecipes((prev) => [...prev, ...(data.recipes || data)])
        }

        if (data.pagination) {
          setPagination(data.pagination)
          setCurrentPage(data.pagination.currentPage)
        }

        if (isInitialLoad) {
          setIsInitialLoad(false)
        }
      } catch (error) {
        console.error(error)
        toast.error("Greška pri dohvaćanju recepata.")
      } finally {
        setIsLoadingRecipes(false)
        setIsFiltering(false)
        setIsLoadingMore(false)
      }
    },
    500,
  )

  useEffect(() => {
    debouncedFetchRecipes(
      searchTerm,
      selectedCategoryIds,
      selectedAllergyIds,
      selectedDifficultyIds,
      isVegan,
      isVegetarian,
      ingredientSearch,
      maxPrepTime,
      minServings,
    )
  }, [
    searchTerm,
    selectedCategoryIds,
    selectedAllergyIds,
    selectedDifficultyIds,
    isVegan,
    isVegetarian,
    ingredientSearch,
    maxPrepTime,
    minServings,
    debouncedFetchRecipes,
  ])

  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        setIsLoadingCategories(true)
        const catRes = await fetch("/api/categories")
        if (!catRes.ok) {
          throw new Error("Failed to fetch categories")
        }
        const categoriesData = await catRes.json()
        setAllCategories(
          categoriesData.map((c: Category) => ({ id: c.id, name: c.name })),
        )
      } catch (error) {
        console.error(error)
        toast.error("Greška pri dohvaćanju kategorija.")
      } finally {
        setIsLoadingCategories(false)
      }

      try {
        setIsLoadingAllergies(true)
        const algRes = await fetch("/api/allergies")
        if (!algRes.ok) {
          throw new Error("Failed to fetch allergies")
        }
        const allergiesData = await algRes.json()
        setAllAllergies(
          allergiesData.map((a: Allergy) => ({ id: a.id, name: a.name })),
        )
      } catch (error) {
        console.error(error)
        toast.error("Greška pri dohvaćanju alergena.")
      } finally {
        setIsLoadingAllergies(false)
      }

      try {
        setIsLoadingDifficulties(true)
        const diffRes = await fetch("/api/difficulties")
        if (!diffRes.ok) {
          throw new Error("Failed to fetch difficulties")
        }
        const difficultiesData = await diffRes.json()
        setAllDifficulties(
          difficultiesData.map((d: Difficulty) => ({
            id: d.id,
            name: `${d.name} (razina ${d.level})`,
          })),
        )
      } catch (error) {
        console.error(error)
        toast.error("Greška pri dohvaćanju težina pripreme.")
      } finally {
        setIsLoadingDifficulties(false)
      }

      if (session && !searchParams.get("allergyIds")) {
        try {
          const userAllergiesRes = await fetch("/api/user-allergies")
          if (userAllergiesRes.ok) {
            const userAllergiesData = await userAllergiesRes.json()
            const userAllergyIds = userAllergiesData.userAllergies.map(
              (a: Allergy) => a.id,
            )
            setSelectedAllergyIds(userAllergyIds)
          }
        } catch (error) {
          console.error("Error fetching user allergies:", error)
        }
      }
    }

    fetchFilterOptions()
  }, [session, searchParams])
  const clearFilters = () => {
    setSearchTerm("")
    setSelectedCategoryIds([])
    setSelectedAllergyIds([])
    setSelectedDifficultyIds([])
    setIsVegan(false)
    setIsVegetarian(false)
    setIngredientSearch("")
    setMaxPrepTime("")
    setMinServings("")
    setCurrentPage(1)
    setPagination(undefined)
  }

  const handleLoadMore = () => {
    if (pagination?.hasMore) {
      const nextPage = currentPage + 1
      debouncedFetchRecipes(
        searchTerm,
        selectedCategoryIds,
        selectedAllergyIds,
        selectedDifficultyIds,
        isVegan,
        isVegetarian,
        ingredientSearch,
        maxPrepTime,
        minServings,
        nextPage,
        false,
      )
    }
  }

  const hasActiveFilters = useMemo(() => {
    return Boolean(
      searchTerm ||
        selectedCategoryIds.length > 0 ||
        selectedAllergyIds.length > 0 ||
        selectedDifficultyIds.length > 0 ||
        isVegan ||
        isVegetarian ||
        ingredientSearch ||
        maxPrepTime ||
        minServings,
    )
  }, [
    searchTerm,
    selectedCategoryIds,
    selectedAllergyIds,
    selectedDifficultyIds,
    isVegan,
    isVegetarian,
    ingredientSearch,
    maxPrepTime,
    minServings,
  ])

  return (
    <div className="max-w-7xl mx-auto p-6 pt-25">
      <div className="flex flex-col md:flex-row justify-between md:items-center mb-4 gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Recepti</h1>
          <p className="text-muted-foreground">
            Otkrijte i podijelite nevjerojatne recepte
          </p>
        </div>
        {isSessionLoading ? (
          <Skeleton className="h-10 w-36" />
        ) : (
          session && (
            <Link
              href="/recipes/new"
              className={buttonVariants({ variant: "default" })}
            >
              <Plus className="mr-2 h-4 w-4" /> Stvori recept
            </Link>
          )
        )}
      </div>
      <RecipeFilters
        searchTerm={searchTerm}
        onSearchTermChange={setSearchTerm}
        allCategories={allCategories}
        selectedCategoryIds={selectedCategoryIds}
        onSelectedCategoryIdsChange={setSelectedCategoryIds}
        isLoadingCategories={isLoadingCategories}
        allAllergies={allAllergies}
        selectedAllergyIds={selectedAllergyIds}
        onSelectedAllergyIdsChange={setSelectedAllergyIds}
        isLoadingAllergies={isLoadingAllergies}
        allDifficulties={allDifficulties}
        selectedDifficultyIds={selectedDifficultyIds}
        onSelectedDifficultyIdsChange={setSelectedDifficultyIds}
        isLoadingDifficulties={isLoadingDifficulties}
        isVegan={isVegan}
        onIsVeganChange={setIsVegan}
        isVegetarian={isVegetarian}
        onIsVegetarianChange={setIsVegetarian}
        ingredientSearch={ingredientSearch}
        onIngredientSearchChange={setIngredientSearch}
        maxPrepTime={maxPrepTime}
        onMaxPrepTimeChange={setMaxPrepTime}
        minServings={minServings}
        onMinServingsChange={setMinServings}
        hasActiveFilters={hasActiveFilters}
        onClearFilters={clearFilters}
        isFiltering={isFiltering}
      />
      <RecipeListDisplay
        isLoadingRecipes={isLoadingRecipes}
        filteredRecipes={filteredRecipes}
        hasActiveFilters={hasActiveFilters}
        onClearFilters={clearFilters}
        pagination={pagination}
        onLoadMore={handleLoadMore}
        isLoadingMore={isLoadingMore}
      />
    </div>
  )
}
