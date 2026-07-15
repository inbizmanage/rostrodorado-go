import React, { useEffect, useState } from 'react';
import { m as motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { db } from '../../firebase';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { BlogPost } from '../../types';
import { ArrowRight } from 'lucide-react';
import { normalizeImageUrl } from '../../utils/imageUrl';

const BlogPage = () => {
    const [posts, setPosts] = useState<BlogPost[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPosts = async () => {
            try {
                const q = query(
                    collection(db, 'posts'),
                    where('published', '==', true)
                );
                const snapshot = await getDocs(q);
                const fetchedPosts = snapshot.docs.map(doc => {
                    const data = doc.data() as BlogPost;
                    return {
                        id: doc.id,
                        ...data,
                        coverImage: normalizeImageUrl(data.coverImage)
                    };
                }) as BlogPost[];
                setPosts(fetchedPosts);
            } catch (error) {
                console.error("Error fetching blog posts:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchPosts();
    }, []);

    return (
        <div className="bg-white min-h-screen pt-28 pb-20">
            <div className="max-w-4xl mx-auto px-6">

                {/* Minimal Header */}
                <div className="text-center mb-20">
                    <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="inline-block text-[10px] uppercase tracking-[0.4em] text-gold font-sans font-bold mb-4"
                    >
                        Rostro Dorado Clinic
                    </motion.span>
                    <motion.h1
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="font-serif text-4xl md:text-5xl text-charcoal mb-5"
                    >
                        Blog
                    </motion.h1>
                    <motion.div
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ delay: 0.3, duration: 0.6 }}
                        className="w-12 h-px bg-gold mx-auto mb-6"
                    />
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="font-sans text-sm text-gray-400 max-w-md mx-auto leading-relaxed"
                    >
                        Consejos de medicina estética, cuidado de la piel y las últimas tendencias en tratamientos.
                    </motion.p>
                </div>

                {loading ? (
                    <div className="flex justify-center h-64 items-center">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gold"></div>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {posts.length > 0 ? (
                            posts.map((post, idx) => (
                                <motion.div
                                    key={post.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.08 }}
                                >
                                    <Link
                                        to={`/blog/${post.slug}`}
                                        className="group grid grid-cols-1 md:grid-cols-[200px_1fr] gap-6 md:gap-10 py-10 items-center"
                                    >
                                        {/* Square Thumbnail */}
                                        <div className="aspect-square w-full md:w-[200px] rounded-xl overflow-hidden bg-gray-50 shrink-0">
                                            <img
                                                src={post.coverImage}
                                                alt={post.title}
                                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                            />
                                        </div>

                                        {/* Text Content */}
                                        <div className="flex flex-col justify-center">
                                            <span className="text-[10px] font-sans font-bold text-gold tracking-[0.2em] uppercase mb-3">
                                                {new Date(post.createdAt?.seconds * 1000).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                                            </span>
                                            <h2 className="font-serif text-2xl md:text-3xl text-charcoal mb-3 group-hover:text-gold transition-colors duration-300 leading-tight">
                                                {post.title}
                                            </h2>
                                            <p className="text-gray-400 font-sans text-sm leading-relaxed line-clamp-2 mb-4">
                                                {post.excerpt}
                                            </p>
                                            <span className="inline-flex items-center gap-2 text-[11px] font-sans font-bold uppercase tracking-[0.15em] text-charcoal group-hover:text-gold transition-colors duration-300">
                                                Leer artículo
                                                <ArrowRight size={14} className="transition-transform duration-300 group-hover:translate-x-1" />
                                            </span>
                                        </div>
                                    </Link>
                                </motion.div>
                            ))
                        ) : (
                            <div className="text-center py-20 text-gray-400">
                                <p className="font-sans text-sm">Aún no hay artículos publicados.</p>
                            </div>
                        )}
                    </div>
                )}

            </div>
        </div>
    );
};

export default BlogPage;
