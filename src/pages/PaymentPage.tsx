import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispenseJob } from "../hooks/useDispenseJob";
import { subscribeMedicines, MedicineSlot } from "../services/firebaseService";
import { ref, set } from "firebase/database";
import { rtdb } from "../firebase/config";

const PaymentPage = () => {
    const navigate = useNavigate();

    // Live medicines from Firestore — same pattern as Kiosk.tsx
    const [medicines, setMedicines] = useState<MedicineSlot[]>([]);
    useEffect(() => {
        const unsub = subscribeMedicines((slots) => setMedicines(slots));
        return unsub;
    }, []);

    // Dummy cart — uses Firestore document IDs, not mock IDs
    const cart: { [id: string]: number } = {};

    const { startDispense } = useDispenseJob(cart, medicines);

    const queryParams = new URLSearchParams(window.location.search);
    const txnId = queryParams.get("txn");
    const amount = queryParams.get("amount");

    const [isProcessing, setIsProcessing] = useState(false);
    const [paymentStatus, setPaymentStatus] = useState<"idle" | "success" | "error">("idle");

    const handleConfirmPayment = async () => {
        if (isProcessing) return;
        setIsProcessing(true);

        try {
            if (txnId && rtdb) {
                // Update the payment status in RTDB
                await set(ref(rtdb, `payments/${txnId}/status`), "success");
                setPaymentStatus("success");
            } else {
                // Dummy/fallback mode when accessed directly without params
                await startDispense("TEST-" + Date.now());
                // Go to dispensing page
                navigate("/dispensing");
            }
        } catch (err) {
            console.error(err);
            setPaymentStatus("error");
            alert("Something went wrong!");
        } finally {
            setIsProcessing(false);
        }
    };

    if (paymentStatus === "success") {
        return (
            <div className="min-h-screen bg-slate-100 flex items-center justify-center">
                <div className="bg-white shadow-xl rounded-2xl p-10 w-[420px] text-center">
                    <h1 className="text-3xl font-bold mb-4 text-green-600">
                        Payment Successful!
                    </h1>
                    <p className="text-slate-600">
                        The Kiosk screen has been updated. Please collect your medicine from the dispenser.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-100 flex items-center justify-center">
            <div className="bg-white shadow-xl rounded-2xl p-10 w-[420px] text-center">

                <h1 className="text-3xl font-bold mb-4">
                    Dummy Payment
                </h1>

                <p className="text-slate-600 mb-8">
                    {txnId ? (
                        <>
                            Paying for Transaction: <span className="font-mono font-bold text-slate-800">{txnId}</span>
                            <br />
                            Amount: <span className="font-bold text-blue-600">₹{amount ?? "0"}</span>
                        </>
                    ) : (
                        <>
                            QR scanned successfully.
                            <br />
                            Click the button below to simulate payment.
                        </>
                    )}
                </p>

                <button
                    onClick={handleConfirmPayment}
                    disabled={isProcessing}
                    className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-bold py-4 rounded-xl transition cursor-pointer"
                >
                    {isProcessing ? "Confirming..." : "Confirm Payment"}
                </button>

            </div>
        </div>
    );
};

export default PaymentPage;