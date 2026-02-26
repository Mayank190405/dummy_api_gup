"use client";

import React from "react";
import dynamic from "next/dynamic";

const Toaster = dynamic(
    () => import("react-hot-toast").then((mod) => mod.Toaster),
    { ssr: false }
);

export default function Providers({ children }: { children: React.ReactNode }) {
    return (
        <>
            <Toaster position="top-right" />
            {children}
        </>
    );
}
