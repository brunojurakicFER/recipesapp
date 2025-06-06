"use client"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Star, User2 } from "lucide-react"
import type { ReviewWithUser } from "@/lib/types"
import { EditReviewDialog } from "./EditReviewDialog"
import { useRouter } from "next/navigation"

type RecipeReviewsProps = {
  reviews: ReviewWithUser[]
  currentUserId?: string
}

export function RecipeReviews({ reviews, currentUserId }: RecipeReviewsProps) {
  const router = useRouter()

  if (reviews.length === 0) return null

  const handleReviewUpdated = () => {
    router.refresh()
  }

  return (
    <Card className="shadow-xl">
      <CardHeader className="pb-3">
        <CardTitle>Recenzije</CardTitle>
        <CardDescription>
          {reviews.length}{" "}
          {reviews.length === 1
            ? "recenzija"
            : reviews.length > 1 && reviews.length < 5
              ? "recenzije"
              : "recenzija"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {" "}
        <div className="space-y-6">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="border-b pb-4 last:border-0 last:pb-0"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    {review.user.image ? (
                      <AvatarImage
                        src={review.user.image}
                        alt={review.user.name || ""}
                      />
                    ) : null}
                    <AvatarFallback className="text-xs">
                      {review.user.name ? (
                        review.user.name.charAt(0).toUpperCase()
                      ) : (
                        <User2 className="h-4 w-4" />
                      )}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="font-medium">{review.user.name}</span>
                    <span className="text-xs text-gray-500">
                      {new Date(review.updatedAt).toLocaleDateString("hr-HR", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {currentUserId && currentUserId === review.userId && (
                    <EditReviewDialog
                      review={review}
                      onReviewUpdated={handleReviewUpdated}
                    />
                  )}
                  <div className="flex">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        strokeWidth={1.5}
                        key={i}
                        className={
                          i < review.rating
                            ? "text-zinc-500 fill-yellow-500"
                            : "text-zinc-400"
                        }
                      />
                    ))}
                  </div>
                </div>
              </div>
              {review.content && <p className="text-sm">{review.content}</p>}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
