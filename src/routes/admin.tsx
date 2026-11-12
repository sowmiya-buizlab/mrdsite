import { createFileRoute } from "@tanstack/react-router";
import BlogAdmin from "@/components/BlogAdmin";

export const Route = createFileRoute("/admin")({ component: BlogAdmin });
