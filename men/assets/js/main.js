const socket = io();

const openContent = contentID=>{window.location.href='/content/id/'+contentID} // when user click on a content card

const openProfile = id =>{window.location.href='/account/profile/'+id}// when user click on profile button