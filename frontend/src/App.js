import './App.css';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { addAlert, deleteAlert } from './redux/alertSlice';
import { library } from "@fortawesome/fontawesome-svg-core"
import { fas } from '@fortawesome/free-solid-svg-icons';
import { far } from '@fortawesome/free-regular-svg-icons';
import { fab } from '@fortawesome/free-brands-svg-icons'
import { Button, Modal } from 'react-bootstrap';
import { addWarnings, deleteWarning } from './redux/warningSlice';
import { useEffect } from 'react';
import { socket } from './socket';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useCookies } from 'react-cookie';
import { Outlet } from 'react-router-dom';
import UsernameInput from './components/shared/usernameInput';
import NavBar from './components/shared/navBar';

let fristTime = true;
function App() {
  const [cookies] = useCookies(['user']);
  const [alerts, warnings, mode] = useSelector(state=> ([state.alerts, state.warnings, state.mode]), shallowEqual);
  const dispatch = useDispatch();

  let removeWarningClicked = false;
  const removeWarning = ()=>{
    if(removeWarningClicked) return null;
    removeWarningClicked = true
    if(!warnings.length) return null;
    fetch(process.env.REACT_APP_API_SERVER+"/account/warning",{
      method: "delete",
      credentials: 'include',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({warning: warnings[0]})
    }).then(res=>{
      if(res.ok){
        window.localStorage.setItem("warnings", warnings.slice(1))
        dispatch(deleteWarning())
      }else
        throw res.json()
    }).catch((err)=>{
      console.error(err.msg?err.msg:err)
    }).finally(()=>{removeWarningClicked = false})
  }

  let isUsernameClicked = false
  const sendUsername= e=>{
    e.preventDefault()
    if(isUsernameClicked) return null;
    isUsernameClicked = true
    const form = e.target.form
    const data = new URLSearchParams();
    data.append('username', form.username.value)
    fetch(process.env.REACT_APP_API_SERVER+"/account/oauth/username/set",{
      method: "post",
      credentials: 'include',
      body: data
    }).then(async res=>{
      if(!res.ok)
        throw await res.json()
    }).catch(err=>{
      form.reset()
      if(err.msg)
        dispatch(addAlert({type:"danger", msg: err.msg}))
      else{
        console.error(err)
        dispatch(addAlert({type:"danger", msg: "Something Went Wrong, Try Again!"}))
      }
    })
  }

  
  useEffect(()=>{
    if(window.localStorage.getItem("warnings"))
      dispatch(addWarnings(JSON.parse(window.localStorage.getItem("warnings"))))

    if(cookies.user && fristTime){
      fristTime = false;
      socket.emit("makeRoom", cookies.user._id, cookies.user.role) //to can emit specific functions for each user / user role

      socket.on("warning", reason=>{
        window.localStorage.setItem("warnings", JSON.stringify([...warnings, reason]))
        dispatch(addWarnings([reason]))
      })
    }
  },[cookies])

  return (
    <div className={`App ${mode === 'light'? 'bg-light':'bg-dark text-light'}`}>
      {alerts &&
        <div className='toast-container position-fixed bottom-0 end-0 pb-5 pe-3'>
          <div className={`toast align-items-center d-flex justify-content-between  show text-bg-${alerts.type} border-0 z-3`} role="alert" aria-live="assertive" aria-atomic="true"> 
            <span className="toast-body">{alerts.msg}</span>
            <button className="btn-close btn-close-white p-3" aria-label="close" onClick={()=> dispatch(deleteAlert())}></button>
          </div>
        </div>
      }
      
      <NavBar mode={mode}/>
      {
      cookies.user&&!cookies.user.username?
        <div className='container mt-5'>
          <h1>Hi, {cookies.user.firstName}!</h1>
          <p>To complete your setup, please enter a username.</p>
          <p>Your username will be your unique identity on our platform. Make it something memorable!</p>
          <form className='input-group'>
            <UsernameInput/>
            <button className='btn btn-outline-primary' onClick={sendUsername}>Submit</button>
          </form>
        </div>
      : <Outlet/>
      }
      
      <Modal show={warnings.length?true:false}
        className="modal warning fade"
        data-bs-backdrop="static"
        id="adminWarning"
        tabIndex="-1"
      >
        <Modal.Header className="text-danger justify-content-start gap-3">
          <FontAwesomeIcon icon={"fa-solid fa-triangle-exclamation"} className="fs-2" />
          <Modal.Title>
            Warning From The Admin
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-danger">
          {warnings &&
            <h6 className='text-break'>
              {warnings[0]}
            </h6> 
          }
        </Modal.Body>
        <Modal.Footer>
          <Button variant='danger' onClick={removeWarning}>
            OK
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default App;
library.add(fas, far, fab)