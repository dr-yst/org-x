<script lang="ts">
    import { currentDocument } from "$lib/stores/documents";
</script>

<div class="p-4 max-w-4xl mx-auto">
    <h1 class="text-2xl font-bold mb-5">{$currentDocument.title}</h1>
    <pre
        class="whitespace-pre-wrap font-mono leading-relaxed bg-gray-100 p-4 rounded shadow-xs border border-gray-200 overflow-auto max-h-[70vh]">{$currentDocument.content}</pre>
</div>
