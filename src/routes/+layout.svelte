<script>
    import "../app.css";
    let { children } = $props();
</script>

<div class="min-h-screen bg-gray-50">
    <header class="bg-white shadow-xs p-4 mb-6">
        <div class="max-w-6xl mx-auto flex justify-between items-center">
            <h1 class="text-2xl font-black font-[Poppins] text-indigo-600">
                Org-X
            </h1>
            <nav class="hidden md:block">
                <ul class="flex space-x-6">
                    <li>
                        <a
                            href="/"
                            class="text-gray-700 hover:text-indigo-600 transition"
                            >Documents</a
                        >
                    </li>
                    <li>
                        <a
                            href="/tasks"
                            class="text-gray-700 hover:text-indigo-600 transition"
                            >Tasks</a
                        >
                    </li>
                    <li>
                        <a
                            href="/settings"
                            class="text-gray-700 hover:text-indigo-600 transition"
                            >Settings</a
                        >
                    </li>
                </ul>
            </nav>
        </div>
    </header>

    <main class="max-w-6xl mx-auto px-4">
        {@render children()}
    </main>

    <footer class="mt-12 py-6 text-center text-gray-500 text-sm">
        <p>Org-X © {new Date().getFullYear()}</p>
    </footer>
</div>
