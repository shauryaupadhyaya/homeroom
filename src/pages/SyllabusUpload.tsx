import { useState } from "react";
import { useApp } from "../lib/store";
import { supabase } from "../lib/supabase";
import { Card, Button } from "../components/ui";
import { Upload, File, Trash2, Download } from "lucide-react";

interface SyllabusFile {
  id: string;
  classId: string;
  filename: string;
  fileUrl: string;
  fileSize: number;
  uploadedBy: string;
  createdAt: string;
}

export function SyllabusUpload() {
  const { classes } = useApp();
  const [selectedClassId, setSelectedClassId] = useState<string | null>(classes[0]?.id || null);
  const [files, setFiles] = useState<SyllabusFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedClassId) return;

    setIsUploading(true);
    try {
      const filePath = `syllabi/${selectedClassId}/${Date.now()}-${file.name}`;

      const { data, error } = await supabase.storage
        .from("syllabi")
        .upload(filePath, file);

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from("syllabi")
        .getPublicUrl(filePath);

      const syllabus = {
        id: `sf${Date.now()}`,
        classId: selectedClassId,
        filename: file.name,
        fileUrl: urlData.publicUrl,
        fileSize: file.size,
        uploadedBy: "teacher@example.com",
        createdAt: new Date().toISOString(),
      };

      await supabase.from("syllabus_files").insert({
        id: syllabus.id,
        class_id: selectedClassId,
        filename: file.name,
        file_url: urlData.publicUrl,
        file_size: file.size,
        uploaded_by: "teacher@example.com",
      });

      setFiles((prev) => [...prev, syllabus]);
    } catch (error) {
      console.error("Upload failed:", error);
      alert("Failed to upload file. Make sure Supabase Storage is set up.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (fileId: string) => {
    try {
      const file = files.find((f) => f.id === fileId);
      if (!file) return;

      const storagePath = file.fileUrl.split("/syllabi/")[1];
      await supabase.storage.from("syllabi").remove([`syllabi/${storagePath}`]);
      await supabase.from("syllabus_files").delete().eq("id", fileId);

      setFiles((prev) => prev.filter((f) => f.id !== fileId));
    } catch (error) {
      console.error("Delete failed:", error);
    }
  };

  const selectedClass = classes.find((c) => c.id === selectedClassId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-(--color-ink)">Syllabus Upload</h1>
        <p className="mt-1 text-sm text-(--color-ink-muted)">Upload and manage syllabus PDFs for each class</p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[200px_1fr]">
        <div className="flex flex-col gap-2">
          {classes.map((cls) => (
            <button
              key={cls.id}
              onClick={() => setSelectedClassId(cls.id)}
              className={`rounded-lg border-2 px-3 py-2 text-sm font-bold transition-colors ${
                selectedClassId === cls.id
                  ? "border-(--color-border) bg-(--color-orange-500) text-(--color-ink-on-accent)"
                  : "border-(--color-border) text-(--color-ink-muted) hover:bg-(--color-paper-dim)"
              }`}
            >
              {cls.name}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          {selectedClass && (
            <Card className="border-dashed">
              <div className="flex flex-col items-center justify-center py-8">
                <Upload size={32} className="mb-3 text-(--color-orange-500)" />
                <h3 className="mb-2 font-bold text-(--color-ink)">{selectedClass.name} - Upload Syllabus</h3>
                <p className="mb-4 text-sm text-(--color-ink-muted)">Drag and drop or click to select PDF</p>
                <label>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileSelect}
                    disabled={isUploading}
                    className="hidden"
                  />
                  <Button
                    as="span"
                    disabled={isUploading}
                    className="cursor-pointer"
                  >
                    {isUploading ? "Uploading..." : "Select File"}
                  </Button>
                </label>
              </div>
            </Card>
          )}

          {files.length > 0 && (
            <Card>
              <h3 className="mb-4 font-bold text-(--color-ink)">Uploaded Files</h3>
              <div className="space-y-2">
                {files.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between rounded-lg border border-(--color-border) bg-(--color-paper) p-3"
                  >
                    <div className="flex items-center gap-3">
                      <File size={20} className="text-(--color-orange-500)" />
                      <div>
                        <p className="text-sm font-bold text-(--color-ink)">{file.filename}</p>
                        <p className="text-xs text-(--color-ink-muted)">
                          {(file.fileSize / 1024).toFixed(2)} KB
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <a
                        href={file.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-lg border-2 border-(--color-border) bg-(--color-paper) p-2 hover:bg-(--color-paper-dim)"
                      >
                        <Download size={16} />
                      </a>
                      <button
                        onClick={() => handleDelete(file.id)}
                        className="rounded-lg border-2 border-(--color-border) bg-(--color-paper) p-2 hover:bg-(--color-danger-100)"
                      >
                        <Trash2 size={16} className="text-(--color-danger)" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
