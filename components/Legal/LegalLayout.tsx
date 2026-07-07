import React from 'react';
import { m as motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import Navbar from '../Layout/Navbar';
import Footer from '../Layout/Footer';

interface LegalLayoutProps {
    title: string;
    children: React.ReactNode;
}

const LegalLayout: React.FC<LegalLayoutProps> = ({ title, children }) => {
    return (
        <div className="min-h-screen bg-white text-gray-900 flex flex-col">
            <Navbar />

            <div className="flex-grow pt-32 pb-20 px-4 sm:px-6 lg:px-8">
                <div className="max-w-4xl mx-auto">
                    <Link to="/" className="inline-flex items-center text-gold hover:text-yellow-600 mb-8 transition-colors font-medium">
                        <ArrowLeft size={20} className="mr-2" />
                        Volver al Inicio
                    </Link>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white border border-gray-200 rounded-2xl p-8 sm:p-12 shadow-xl"
                    >
                        <h1 className="text-3xl sm:text-4xl font-serif text-black mb-12 border-b border-gray-100 pb-6">
                            {title}
                        </h1>

                        <div className="prose prose-lg prose-headings:font-serif prose-headings:font-medium prose-p:text-gray-600 prose-li:text-gray-600 max-w-none">
                            {children}
                        </div>
                    </motion.div>
                </div>
            </div>

            <Footer />
        </div>
    );
};

export default LegalLayout;
