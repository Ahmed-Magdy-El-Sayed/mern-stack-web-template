import React from "react";
import ContentCard from "../../../shared/contentCard";
import { useLoaderData } from "react-router-dom";

export default function ProfileFavorite(){
    const loaderData = useLoaderData();

    return loaderData.favContents.length?
        <>
            <h2 className="mb-4">Contents</h2>
            <div className="d-flex flex-wrap justify-content-center gap-3">
                {loaderData.favContents.map(content => 
                    <ContentCard key={content._id} content={content}/>
                )}
            </div>
        </>
    : <div className="text-secondary text-center">
        Your favorite list is empty!
    </div>
}