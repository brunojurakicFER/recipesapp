import React from "react"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { headers } from "next/headers"
import { Clock, Users, ChevronLeft, UserPen, Target, Leaf } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { getRecipe } from "@/db/queries"
import { auth } from "@/lib/auth"
import { RecipeIngredients } from "@/components/recipe_page/RecipeIngredients"
import { RecipeInstructions } from "@/components/recipe_page/RecipeInstructions"
import { RecipeAllergies } from "@/components/recipe_page/RecipeAllergies"
import { RecipeReviews } from "@/components/recipe_page/RecipeReviews"
import { RecipeAuthor } from "@/components/recipe_page/RecipeAuthor"
import { BookmarkButton } from "@/components/recipe_page/BookmarkButton"
import { ReviewDialog } from "@/components/recipe_page/ReviewDialog"
import { DeleteRecipeButton } from "@/components/recipe_page/DeleteRecipeButton"
import { EditRecipeButton } from "@/components/recipe_page/EditRecipeButton"
import { Suspense } from "react"

export default async function RecipePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const recipe = await getRecipe(id)

  if (!recipe) {
    notFound()
  }

  const session = await auth.api.getSession({
    headers: await headers(),
  })

  const isAuthor = session?.user?.id === recipe.userId

  const averageRating =
    recipe.reviews.length > 0
      ? recipe.reviews.reduce((sum, review) => sum + review.rating, 0) /
        recipe.reviews.length
      : 0

  return (
    <div className="container max-w-7xl mx-auto py-10 px-4 sm:px-6 pt-20">
      <Link
        href="/recipes"
        className="inline-flex items-center text-sm mb-6 text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="mr-1 h-4 w-4" />
        Natrag na recepte
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div>
            <div className="relative h-[400px] w-full rounded-lg overflow-hidden mb-6 border border-border shadow-lg">
              <Image
                src={recipe.image_path}
                alt={recipe.title}
                fill
                className="object-cover"
                priority
              />
            </div>
            <h1 className="text-3xl font-bold">{recipe.title}</h1>{" "}
            <div className="flex flex-wrap gap-2 mt-3">
              {recipe.categories.map(({ category }) => (
                <Badge key={category.id} variant="outline">
                  {category.name}
                </Badge>
              ))}              {recipe.difficulty && (
                <Badge
                  variant="outline"
                  className="bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800"
                >
                  <Target className="w-3 h-3 mr-1" />
                  {recipe.difficulty.name}
                </Badge>
              )}
              {recipe.isVegan && (
                <Badge
                  variant="outline"
                  className="bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800"
                >
                  <Leaf className="w-3 h-3 mr-1" />
                  Veganski
                </Badge>
              )}
              {recipe.isVegetarian && !recipe.isVegan && (
                <Badge
                  variant="outline"
                  className="bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800"
                >
                  <Leaf className="w-3 h-3 mr-1" />
                  Vegetarijanski
                </Badge>
              )}
            </div>
            <div className="flex flex-wrap gap-6 mt-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>{recipe.preparationTime} minuta</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span>{recipe.servings} porcija</span>
              </div>
              <div className="flex items-center gap-2">
                <UserPen className="h-4 w-4" />
                <span>{recipe.user.name}</span>
              </div>
              {averageRating > 0 && (
                <div className="flex items-center gap-1">
                  <span>★</span>
                  <span>
                    {averageRating.toFixed(1)} ({recipe.reviews.length}{" "}
                    {recipe.reviews.length === 1 ? "recenzija" : "recenzije"})
                  </span>
                </div>
              )}
            </div>
            <p className="mt-6 text-muted-foreground">{recipe.description}</p>
          </div>

          <div className="lg:hidden">
            <RecipeIngredients
              ingredients={recipe.ingredients}
              servings={recipe.servings}
            />
          </div>

          <RecipeAllergies allergies={recipe.allergies} />
          <RecipeInstructions instructions={recipe.instructions} />
          <RecipeReviews
            reviews={recipe.reviews}
            currentUserId={session?.user?.id}
          />
        </div>

        <div className="space-y-8">
          <div className="hidden lg:block">
            <RecipeIngredients
              ingredients={recipe.ingredients}
              servings={recipe.servings}
            />
          </div>
          <RecipeAuthor user={recipe.user} />
          <div className="space-y-4">
            <Suspense
              fallback={<BookmarkButton recipeId="" isInitialLoading />}
            >
              <BookmarkButton recipeId={recipe.id} />
            </Suspense>
            <ReviewDialog recipeId={recipe.id} isAuthor={isAuthor} />
            {isAuthor && (
              <>
                <EditRecipeButton recipeId={recipe.id} />
                <DeleteRecipeButton recipeId={recipe.id} />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
