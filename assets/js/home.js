let contentsViewed = 10//to count the contents number that retrieved, so skip this number when get more 

let getContentsClicked = false
const getMoreContents = (target)=>{//onclick on show more after each group of contents 
    if(getContentsClicked) return null
    getContentsClicked = true
    fetch('/content/more',{
        method:'post',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({skip: contentsViewed})
    }).then(res=>{
        if(res.status == 200) return res.json()
        else throw res.body;
    }).then(contents=>{
        if(!contents.length){
            target.parentElement.remove()
            return null
        }
        contentsViewed += 10
        contents.forEach(content=>{//take each content object. make the html content, then add to the dom
            if(!content.hidden || me?.isAdmin || me?.isEditor || String(me?._id) == content.author.id)//- prevent show the content if it is set to be hidden or the user is admin, editor, or the content author 
                target.parentElement.previousElementSibling.insertAdjacentHTML('beforeend', `
                <div class="card text-center" style="width: 18rem; cursor:pointer" onclick="openContent('${content._id}')">
                    <div class="card-body">
                        <h3 class="card-text content-name text-primary">${content.name}</h3>
                        <p>comments: ${content.commentsNum}</p>
                        ${content.hidden?"<p class='text-secondary'>hidden content</p>":""}
                    </div>
                </div>
                `)
        })
    }).catch(err=>{
        console.error(err)
    }).finally(()=>{
        getContentsClicked = false
    })
}
