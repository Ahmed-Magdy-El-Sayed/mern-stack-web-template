export default function Loader(){
    const spinnerClass = "spinner-grow text-secondary"
    const style = {width: "7px", height: "7px", margin: "0 2px"}
    return <h3 className="alert alert-secondary w-100 text-center">Loading 
    <span className={spinnerClass} style={style} role="status"></span>
    <span className={spinnerClass} style={style} role="status"></span>
    <span className={spinnerClass} style={style} role="status"></span>
    </h3>
}