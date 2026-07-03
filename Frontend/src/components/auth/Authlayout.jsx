import { TrendingUp } from "lucide-react";

export default function AuthLayout({ children }) {
    return (
        <div className="min-h-screen bg-black flex">

            {/* Left */}

            <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-green-600 to-black items-center justify-center">

                <div>

                    <TrendingUp
                        className="mx-auto text-white"
                        size={70}
                    />

                    <h1 className="text-5xl font-bold text-white mt-8">
                        TradeWise
                    </h1>

                    <p className="text-gray-300 mt-4 text-center max-w-sm">
                        Practice investing with virtual money and build
                        confidence before entering the real market.
                    </p>

                </div>

            </div>

            {/* Right */}

            <div className="flex-1 flex justify-center items-center p-8">

                {children}

            </div>

        </div>
    );
}