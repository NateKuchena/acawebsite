"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface TableSkeletonProps {
  columns?: number;
  rows?: number;
  showHeader?: boolean;
  showFilters?: boolean;
}

export function TableSkeleton({
  columns = 6,
  rows = 10,
  showHeader = true,
  showFilters = true,
}: TableSkeletonProps) {
  return (
    <div className="space-y-6">
      {showHeader && (
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-9 w-32" />
            <Skeleton className="h-5 w-64 mt-2" />
          </div>
          <Skeleton className="h-10 w-28" />
        </div>
      )}

      {showFilters && (
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-20" />
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <Skeleton className="h-10 flex-1 min-w-[200px]" />
              <Skeleton className="h-10 w-[150px]" />
              <Skeleton className="h-10 w-28" />
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-32 mt-1" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex gap-4 py-3 border-b">
              {Array.from({ length: columns }).map((_, i) => (
                <Skeleton key={i} className="h-4 w-24" />
              ))}
            </div>
            {Array.from({ length: rows }).map((_, i) => (
              <div key={i} className="flex gap-4 py-3 items-center">
                {Array.from({ length: columns }).map((_, j) => (
                  <Skeleton key={j} className="h-4 w-24" />
                ))}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
