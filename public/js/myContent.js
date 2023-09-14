const confirmReviewer = target=>{ // when the author send the new content 
    socket.emit("confirmReviewers")// if online
    target.type="submit";
    target.onclick = ""
    target.click();
}