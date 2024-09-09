export default function Loader({small}){
    const spinnerClass = "spinner-grow text-secondary"
    const style = {width: "7px", height: "7px", margin: "0 2px"}
    return small?
        <h6 className="alert alert-secondary w-100 text-center">Loading 
            <span className={spinnerClass} style={style} role="status"></span>
            <span className={spinnerClass} style={style} role="status"></span>
            <span className={spinnerClass} style={style} role="status"></span>
        </h6>
    :  <h3 className="alert alert-secondary w-100 text-center">Loading 
        <span className={spinnerClass} style={style} role="status"></span>
        <span className={spinnerClass} style={style} role="status"></span>
        <span className={spinnerClass} style={style} role="status"></span>
    </h3>
}