"use client";

import dynamic from "next/dynamic";

const LazyMap = dynamic(() => import("@/components/Map"), {
  ssr: false,
  loading: () => <p>Loading...</p>,
});

export default function Home() {
  return (
    <main>
      <div className="flex flex-col items-center justify-center h-screen">
        <LazyMap />
      </div>
    </main>
  );
}