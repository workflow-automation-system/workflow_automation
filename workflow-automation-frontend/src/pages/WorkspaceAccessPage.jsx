import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";
import { ROLES } from "../utils/rbac";

const WorkspaceAccessPage = () => {
    const navigate = useNavigate();
    const user = useAuthStore((state) => state.user);

    const role = user?.role || ROLES.USER;

    const requestAccess = () => {
        // ici tu peux appeler une API (email admin / ticket / notification)
        alert("Demande d’accès envoyée à l’administrateur de l’organisation.");
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
            <div className="bg-white shadow-md rounded-2xl p-8 max-w-lg w-full text-center">

                <h1 className="text-xl font-semibold text-gray-800 mb-2">
                    Accès limité
                </h1>

                <p className="text-gray-600 mb-6">
                    Votre rôle actuel ({role}) ne permet pas d’accéder à cette fonctionnalité.
                    Vous pouvez continuer à utiliser les outils disponibles dans votre espace.
                </p>

                <div className="bg-gray-100 rounded-lg p-4 mb-6 text-left">
                    <h2 className="font-medium text-gray-700 mb-2">
                        Ce que vous pouvez faire :
                    </h2>
                    <ul className="text-sm text-gray-600 list-disc ml-5 space-y-1">
                        <li>Consulter les workflows accessibles</li>
                        <li>Utiliser les templates disponibles</li>
                        <li>Suivre vos exécutions</li>
                        <li>Mettre à jour votre profil</li>
                    </ul>
                </div>

                <div className="flex flex-col gap-3">
                    <button
                        onClick={() => navigate("/workflows")}
                        className="bg-black text-white py-2 rounded-lg"
                    >
                        Voir mes workflows
                    </button>

                    <button
                        onClick={() => navigate("/dashboard")}
                        className="bg-gray-200 text-gray-800 py-2 rounded-lg"
                    >
                        Retour au dashboard
                    </button>

                    <button
                        onClick={requestAccess}
                        className="text-blue-600 text-sm underline"
                    >
                        Demander plus de permissions
                    </button>
                </div>
            </div>
        </div>
    );
};

export default WorkspaceAccessPage;