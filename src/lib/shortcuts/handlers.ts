import { commands } from "$lib/bindings";
import type { OrgHeadline } from "$lib/bindings";
import { toast } from "svelte-sonner";
import { get } from "svelte/store";
import { documents } from "$lib/viewmodels/homeview.store";

/**
 * Opens the file containing the given headline in the configured external editor.
 * @param headline - The headline to open in the editor
 */
export async function handleOpenInEditor(headline: OrgHeadline): Promise<void> {
    if (!headline) {
        toast.error("No headline selected");
        return;
    }

    const documentsValue = get(documents);
    const parentDocument = documentsValue.find(
        (doc) => doc.id === headline.document_id,
    );

    if (!parentDocument?.file_path) {
        toast.error("Could not find file path for this headline");
        return;
    }

    try {
        const result = await commands.openFileInExternalEditor(
            parentDocument.file_path,
            headline.line_number || null,
            null, // Column position not available in current data model
        );

        if (result.status === "ok") {
            toast.success("Opened in external editor", {
                description: parentDocument.file_path,
            });
        } else {
            toast.error("Failed to open external editor", {
                description: result.error,
            });
        }
    } catch (error) {
        toast.error("Error opening external editor", {
            description: error instanceof Error ? error.message : String(error),
        });
    }
}
