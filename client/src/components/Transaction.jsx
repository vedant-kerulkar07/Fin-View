import React, { useState } from "react";
import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getEnv } from "@/helpers/getEnv";

const TransactionsPage = () => {
    const [file, setFile] = useState(null);

    const handleUpload = async () => {
        if (!file) return alert("Please select a CSV file");

        const formData = new FormData();
        formData.append("file", file);

        try {
            const res = await fetch(`${getEnv("VITE_API_URL")}/transactions/upload-csv`, {
                method: "POST",
                credentials: "include", 
                body: formData,
            });

            const data = await res.json();
            console.log("Uploaded:", data);

            alert("CSV Uploaded Successfully!");
        } catch (err) {
            console.error(err);
            alert("Upload failed");
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 text-white p-10">
            <div className="max-w-2xl mx-auto">

                {/* Upload Card */}
                <Card className="bg-slate-800 border-slate-700">
                    <CardHeader>
                        <CardTitle>Upload Transactions</CardTitle>
                    </CardHeader>

                    <CardContent>
                        <p className="text-sm text-gray-400 mb-4">
                            Upload your bank statement in <strong>.csv</strong> format.
                        </p>

                        <Input
                            type="file"
                            accept=".csv"
                            onChange={(e) => setFile(e.target.files[0])}
                            className="bg-slate-700 border-slate-600 text-white"
                        />

                        <Button
                            className="mt-4 w-full"
                            onClick={handleUpload}
                        >
                            Upload CSV
                        </Button>
                    </CardContent>
                </Card>

                {/* Example Display Card */}
                <Card className="mt-6 bg-slate-800 border-slate-700">
                    <CardHeader>
                        <CardTitle>Recent Transactions</CardTitle>
                    </CardHeader>

                    <CardContent>
                        <div className="text-sm text-gray-300">
                            Example: Show data after fetching from DB here.
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default TransactionsPage;
