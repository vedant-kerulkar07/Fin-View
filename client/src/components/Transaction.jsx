import React, { useState } from "react";
import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getEnv } from "@/helpers/getEnv";
import { UploadCloud } from "lucide-react";

const TransactionsPage = () => {
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleUpload = async () => {
        if (!file) return alert("Please select a file");

        const formData = new FormData();
        formData.append("file", file);

        try {
            setLoading(true);

            const res = await fetch(`${getEnv("VITE_API_URL")}/transactions/upload-csv`, {
                method: "POST",
                credentials: "include",
                body: formData,
            });

            const data = await res.json();
            console.log("Uploaded:", data);
            alert("Uploaded Successfully!");
        } catch (err) {
            console.error(err);
            alert("Upload failed");
        } finally {
            setLoading(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setFile(e.dataTransfer.files[0]);
    };

    return (
        <div className="min-h-screen bg-slate-900 text-white p-10">
            <div className="max-w-3xl mx-auto space-y-10">

                {/* Upload Section */}
                <Card className="bg-slate-800 border-slate-700 shadow-xl py-4">
                    <CardHeader>
                        <CardTitle className="text-2xl font-semibold text-white">
                            Upload Transactions
                        </CardTitle>
                        <p className="text-sm text-gray-400">
                            Drag & drop your bank statement in <span className="font-semibold">.csv</span> file here.
                            Ensure that the file contains date, merchant and amount.
                        </p>
                    </CardHeader>

                    <CardContent>
                        {/* Drag & Drop Box */}
                        <div
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={handleDrop}
                            className="w-full h-64 border-2 border-dashed border-slate-600 rounded-2xl flex flex-col items-center justify-center
                 hover:border-teal-400 transition cursor-pointer bg-slate-800"
                        >
                            <UploadCloud className="h-14 w-14 text-gray-300 mb-3" />

                            <p className="text-lg font-medium text-gray-300">
                                Drag & Drop or .CSV Files
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                                Supported formats: <span className="font-medium">.csv, .pdf</span>
                            </p>

                            <Button className="mt-6 bg-teal-500 hover:bg-teal-600 text-black font-semibold"
                                onClick={() => document.getElementById("fileInput").click()}
                            >
                                Browse Files
                            </Button>

                            <input
                                id="fileInput"
                                type="file"
                                accept=".csv, .pdf"
                                className="hidden"
                                onChange={(e) => setFile(e.target.files[0])}
                            />
                        </div>

                        {/* Upload Button */}
                        {file && (
                            <div className="mt-4 text-sm text-gray-300">
                                Selected File: <span className="text-teal-400">{file.name}</span>
                            </div>
                        )}

                        <Button
                            className="w-full mt-5 bg-teal-500 hover:bg-teal-600 text-black font-semibold"
                            onClick={handleUpload}
                            disabled={loading}
                        >
                            {loading ? "Uploading..." : "Upload File"}
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default TransactionsPage;
