const entries = performance.getEntriesByType("navigation");
if(entries[0].type == "back_forward")
    window.location.reload()

const confirmReviewer = target=>{ // when the author send the new content 
    socket.emit("confirmReviewers")// if online
    target.type="submit";
    target.onclick = ""
    target.click();
}
