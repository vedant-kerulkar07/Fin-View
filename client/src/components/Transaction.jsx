import React, { useState, useEffect } from "react";
import { CloudUpload, XCircle } from "lucide-react";

// --- UI Components ---
const Card = ({ className, children }) => (
    <div className={`rounded-xl border shadow-md ${className}`}>{children}</div>
);

const CardContent = ({ className, children }) => (
    <div className={`p-6 ${className}`}>{children}</div>
);

const Button = ({ className, children, onClick }) => (
    <button
        className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${className}`}
        onClick={onClick}
    >
        {children}
    </button>
);

const Progress = ({ value, className, indicatorClassName }) => (
    <div className={`w-full h-2 rounded-full overflow-hidden ${className}`}>
        <div className={`h-full ${indicatorClassName}`} style={{ width: `${value}%` }}></div>
    </div>
);

// --- Main Transactions Page ---
const TransactionsPage = () => {
    const [transactions, setTransactions] = useState([]); // Transaction data
    const [isLoading, setIsLoading] = useState(false);   // Loading state for parsing
    const [hasError, setHasError] = useState(false);     // Error state
    const [progress, setProgress] = useState(0);         // Mock progress

    // Format amount with + / - sign
    const formatAmount = (amount) => {
        const absAmount = Math.abs(amount).toFixed(2);
        const sign = amount < 0 ? "-" : "+";
        return `${sign}${absAmount}`;
    };

    // Function to fetch transactions from backend (future integration)
    const fetchTransactions = async (file) => {
        setIsLoading(true);
        setHasError(false);
        setTransactions([]);
        setProgress(0);

        try {
            // Mock upload & parsing progress
            let prog = 0;
            const interval = setInterval(() => {
                prog += 20;
                if (prog > 100) prog = 100;
                setProgress(prog);
            }, 200);

            // Simulate backend call
            const response = await new Promise((resolve, reject) => {
                setTimeout(() => {
                    const isError = Math.random() < 0.3; // 30% chance of error
                    if (isError) reject("Parsing failed");
                    else
                        resolve([
                            { date: "Aug 15, 2025", name: "Reliance Retails", amount: -1140 },
                            { date: "Aug 14, 2025", name: "Jio AirFiber", amount: -799 },
                            { date: "Aug 14, 2025", name: "Milkbasket", amount: -38 },
                            { date: "Aug 13, 2025", name: "Groww", amount: -7218 },
                            { date: "Aug 13, 2025", name: "Netflix", amount: -499 },
                            { date: "Aug 12, 2025", name: "Alison Groomer", amount: 12000 },
                        ]);
                }, 1200);
            });

            clearInterval(interval);
            setTransactions(response);
        } catch (error) {
            setHasError(true);
        } finally {
            setIsLoading(false);
            setProgress(100);
        }
    };

    const handleBrowseFile = () => {
        // In the future, this file will be uploaded
        const file = null; // Replace with selected file
        fetchTransactions(file);
    };

    const retryFetch = () => {
        handleBrowseFile();
    };

    return (
        <div className="min-h-screen w-full bg-[#0f172a] text-white font-sans">
            <div className="max-w-[1350px] mx-auto px-8 py-10">
                <h2 className="text-2xl font-bold mb-8">Transactions</h2>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                    {/* Upload Card */}
                    <Card className="bg-[#1e293b] border border-[#334155] rounded-xl shadow-md md:col-span-2">
                        <CardContent>
                            <h3 className="text-lg font-semibold mb-4">Upload Transactions</h3>
                            <p className="text-sm text-gray-400 mb-6">
                                Drag & drop your bank statement in <strong>.csv or .pdf</strong> file here.
                            </p>
                            <div className="border-2 border-dashed border-[#334155] rounded-xl py-12 flex flex-col justify-center items-center bg-[#0f172a] hover:bg-[#16213a] transition">
                                <CloudUpload className="w-10 h-10 text-[#14b8a6] mb-4" />
                                <p className="text-sm text-gray-300">Drag & Drop or Browse Files</p>
                                <p className="text-[11px] text-gray-500 mt-1">Supported formats: .csv, .pdf</p>
                                <Button
                                    className="mt-5 bg-[#14b8a6] hover:bg-[#0d9488] text-white px-6 py-2"
                                    onClick={handleBrowseFile}
                                >
                                    Browse Files
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Right Card */}
                    {hasError ? (
                        <Card className="bg-[#1e293b] border border-[#334155] rounded-xl shadow-md md:col-span-3 flex flex-col items-center justify-center text-center p-8 min-h-[450px]">
                            <XCircle className="w-16 h-16 text-red-500 mb-4" />
                            <h3 className="text-lg font-semibold mb-2">Something Went Wrong...</h3>
                            <p className="text-sm text-gray-400 mb-4">Please try again in a moment.</p>
                            <Button
                                className="bg-[#14b8a6] hover:bg-[#0d9488] text-white px-4 py-2"
                                onClick={retryFetch}
                            >
                                Retry
                            </Button>
                        </Card>
                    ) : (
                        <Card className="bg-[#1e293b] border border-[#334155] rounded-xl shadow-md md:col-span-3">
                            <CardContent>
                                <h3 className="text-lg font-semibold mb-4">Parsed Transactions</h3>

                                <div className="text-sm text-gray-400 flex justify-between items-center mb-2">
                                    <span>Parsing Status</span>
                                    <span className="text-gray-300">
                                        {isLoading ? "Processing..." : "Completed"}
                                    </span>
                                </div>

                                {isLoading && (
                                    <>
                                        <p className="text-xs text-gray-500 mt-1 mb-3">Parsing in progress...</p>
                                        <Progress value={progress} className="h-2 bg-[#0f172a] mb-5" indicatorClassName="bg-[#14b8a6]" />
                                    </>
                                )}

                                <div className="grid grid-cols-[100px_1fr_100px] text-sm font-semibold border-b border-[#334155] pb-2 mb-3">
                                    <span className="text-gray-400">Date</span>
                                    <span className="text-gray-400">Name</span>
                                    <span className="text-right text-gray-400">Amount</span>
                                </div>

                                <div className="space-y-1">
                                    {transactions.map((txn, index) => (
                                        <div key={index} className="grid grid-cols-[100px_1fr_100px] text-sm py-2">
                                            <span className="text-gray-400">{txn.date}</span>
                                            <span className="text-gray-300">{txn.name}</span>
                                            <span className={`text-right font-medium ${txn.amount < 0 ? "text-red-400" : "text-green-400"}`}>
                                                {formatAmount(txn.amount)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
};
export default TransactionsPage;