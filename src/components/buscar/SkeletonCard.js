import React from 'react';

export default function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-lg border bg-white p-4">
      <div className="h-4 w-3/4 bg-gray-200 mb-2"></div>
      <div className="h-3 w-1/2 bg-gray-200 mb-4"></div>
      <div className="h-8 w-24 bg-gray-200"></div>
    </div>
  );
}
