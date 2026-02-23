import { z } from "zod";

import { Button, Dialog } from "@/components";
import { useAppForm } from "@/lib/form";
import type { GitImportProgress, ImportGitRepoArgs } from "@/lib/tauri";

const importSchema = z.object({
  url: z
    .string()
    .min(1, "Repository URL is required")
    .regex(
      /^https?:\/\/github\.com\/[^/]+\/[^/]+/,
      "Must be a GitHub repository URL (https://github.com/owner/repo)",
    ),
  branch: z.string(),
});

interface ImportGitRepoDialogProps {
  open: boolean;
  progress: GitImportProgress | null;
  onClose: () => void;
  onSubmit: (args: ImportGitRepoArgs) => void;
  isPending: boolean;
}

export function ImportGitRepoDialog({
  open,
  progress,
  onClose,
  onSubmit,
  isPending,
}: ImportGitRepoDialogProps) {
  const isImporting = isPending || (progress !== null && progress.stage !== "complete");

  const form = useAppForm({
    defaultValues: {
      url: "",
      branch: "",
    },
    validators: {
      onChange: importSchema,
    },
    onSubmit: ({ value }) => {
      onSubmit({
        url: value.url,
        branch: value.branch || undefined,
      });
    },
  });

  function handleClose() {
    if (isImporting) return;
    form.reset();
    onClose();
  }

  return (
    <Dialog.Root open={open} onOpenChange={(open) => !open && handleClose()}>
      <Dialog.Portal>
        <Dialog.Backdrop />
        <Dialog.Overlay size="lg">
          <Dialog.Header>
            <Dialog.Title>Import from Git Repository</Dialog.Title>
            {!isImporting && <Dialog.Close />}
          </Dialog.Header>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              form.handleSubmit();
            }}
          >
            <Dialog.Body className="space-y-4">
              <form.AppField name="url">
                {(field) => (
                  <field.TextField
                    label="Repository URL"
                    required
                    placeholder="https://github.com/user/repo"
                    description="GitHub repository URL containing a mod project."
                    disabled={isImporting}
                  />
                )}
              </form.AppField>

              <form.AppField name="branch">
                {(field) => (
                  <field.TextField
                    label="Branch"
                    placeholder="main"
                    description="Branch or tag name. Defaults to 'main' if empty."
                    disabled={isImporting}
                  />
                )}
              </form.AppField>

              {progress && progress.stage !== "complete" && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    {progress.stage === "error" && (
                      <span className="text-red-400">Error occurred</span>
                    )}
                    {progress.stage === "downloading" && (
                      <span className="text-surface-400">Downloading repository...</span>
                    )}
                    {progress.stage === "extracting" && (
                      <span className="text-surface-400">Extracting files...</span>
                    )}
                  </div>
                  {progress.stage !== "error" && (
                    <div className="h-2 overflow-hidden rounded-full bg-surface-700">
                      <div className="h-full w-full animate-pulse rounded-full bg-brand-500 transition-all duration-300" />
                    </div>
                  )}
                </div>
              )}
            </Dialog.Body>

            <Dialog.Footer>
              <Button variant="ghost" onClick={handleClose} disabled={isImporting}>
                Cancel
              </Button>
              <form.Subscribe
                selector={(state) => ({ canSubmit: state.canSubmit, isValid: state.isValid })}
              >
                {({ canSubmit, isValid }) => (
                  <Button
                    variant="filled"
                    loading={isImporting}
                    disabled={!canSubmit || !isValid || isImporting}
                    onClick={() => form.handleSubmit()}
                  >
                    Import
                  </Button>
                )}
              </form.Subscribe>
            </Dialog.Footer>
          </form>
        </Dialog.Overlay>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
