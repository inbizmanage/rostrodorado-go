import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';


interface AdminRouteProps {
    children: React.ReactNode;
}

const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
    const { currentUser, loading } = useAuth();
    const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
    const [checkingRole, setCheckingRole] = useState(true);

    useEffect(() => {
        let isMounted = true;
        const checkAdminRole = async () => {
            console.log('=== ADMIN CHECK START ===');
            console.log('Loading:', loading);
            console.log('CurrentUser:', currentUser?.email);

            if (currentUser) {
                // Fallback: Check email directly if it's the admin email
                if (currentUser.email === 'isauradorado@rostrodorado.com') {
                    console.log('✅ Admin email detected (fallback check)');
                    if (isMounted) {
                        setIsAdmin(true);
                        setCheckingRole(false);
                    }
                    return;
                }

                console.log('Checking admin role for user:', currentUser.email);
                try {
                    const { db } = await import('../../firebase');
                    const { doc, getDoc } = await import('firebase/firestore');
                    
                    const docRef = doc(db, 'users', currentUser.uid);
                    const docSnap = await getDoc(docRef);
                    console.log('User document exists:', docSnap.exists());

                    if (!isMounted) return;

                    if (docSnap.exists()) {
                        const userData = docSnap.data();
                        console.log('User role:', userData?.role);
                        if (userData?.role === 'admin') {
                            setIsAdmin(true);
                        } else {
                            setIsAdmin(false);
                        }
                    } else {
                        setIsAdmin(false);
                    }
                } catch (error) {
                    console.error("❌ Error checking admin role:", error);
                    if (currentUser.email === 'isauradorado@rostrodorado.com') {
                        console.log('✅ Allowing access due to admin email (Firestore offline)');
                        if (isMounted) setIsAdmin(true);
                    } else {
                        if (isMounted) setIsAdmin(false);
                    }
                }
            } else {
                console.log('❌ No current user');
                if (isMounted) setIsAdmin(false);
            }

            if (isMounted) {
                console.log('=== ADMIN CHECK END ===');
                setCheckingRole(false);
            }
        };

        if (!loading) {
            checkAdminRole();
        }

        return () => {
            isMounted = false;
        };
    }, [currentUser, loading]);

    if (loading || checkingRole) {
        return (
            <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">

                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gold"></div>
            </div>
        );
    }

    if (!currentUser || !isAdmin) {
        console.log('Access denied. CurrentUser:', !!currentUser, 'IsAdmin:', isAdmin);
        return <Navigate to="/" replace />;
    }

    return <>{children}</>;
};

export default AdminRoute;
