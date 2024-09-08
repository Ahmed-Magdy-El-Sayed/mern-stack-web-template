import './App.css';
import { useDispatch, useSelector } from 'react-redux';
import { deleteAlert } from './redux/alertSlice';
import { Route, Routes } from 'react-router-dom';
import NavBar from './components/navBar';
import Home from './components/pages/home';
import SignUp from './components/pages/signup';
import Login from './components/pages/login';
import AccountsControl from './components/pages/accountsControl';
import ContentControl from './components/pages/contentControl';
import Content from './components/pages/content';
import ResetPass from './components/pages/resetPass';
import ForgetPass from './components/pages/forgetPass';
import Profile from './components/pages/profile';
import { library } from "@fortawesome/fontawesome-svg-core"
import { fas } from '@fortawesome/free-solid-svg-icons';
import { far } from '@fortawesome/free-regular-svg-icons';
import { Button, Modal } from 'react-bootstrap';
import { addWarnings, deleteWarning } from './redux/warningSlice';
import { useEffect, useState } from 'react';
import { socket } from './socket';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import NotFound from './components/pages/404';
import { addUser } from './redux/userSlice';
import { useCookies } from 'react-cookie';
import ProtectedRoute from './components/protectedRoute';

let forceOnce = true;
function App() {
  const [cookies] = useCookies(['user']);
  const alerts = useSelector(state=> state.alerts);
  const warnings = useSelector(state=> state.warnings);
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

  useEffect(()=>{
    dispatch(addUser(cookies.user))
    console.log(cookies)
    window.addEventListener( "pageshow", e => {
      const historyTraversal = e.persisted || 
        ( typeof window.performance != "undefined" && 
          window.performance.getEntriesByType("navigation")[0].type === 2 );
      if ( historyTraversal ) 
        window.location.reload();
    });
    
    if(window.localStorage.getItem("warnings"))
      dispatch(addWarnings(JSON.parse(window.localStorage.getItem("warnings"))))

    if(cookies.user && forceOnce){
      forceOnce = false;
      socket.emit("makeRoom", cookies.user._id, cookies.user.role) //to can emit specific functions for each user / user role

      socket.on("warning", reason=>{
        window.localStorage.setItem("warnings", JSON.stringify([...warnings, reason]))
        dispatch(addWarnings([reason]))
      })
    }
  },[cookies])
  
  return (
    <div className="App bg-light">
      <NavBar/>

      {alerts.length ?
        <div className={`alert alert-${alerts[alerts.length-1].type} alert-dismissible fade show w-100 text-center position-sticky top-0 mb-0 z-3`}> 
          {alerts[alerts.length-1].msg}
          <button type="button" className="btn-close" aria-label="close" onClick={()=> dispatch(deleteAlert())}></button>
        </div>
      :""}

      <Routes>
        <Route path="/" element={<Home/>}/>
        <Route path="/content/id/:id" element={<Content/>}/>
        <Route element={<ProtectedRoute/>}>
          <Route path="/account/signup" element={<SignUp/>}/>
        </Route>
        <Route element={<ProtectedRoute/>}>
          <Route path="/account/login" element={<Login/>}/>
        </Route>
        <Route path="/account/reset/:id/:resetCode" element={<ResetPass/>}/>
        <Route path="/account/password-forgot" element={<ForgetPass/>}/>
        <Route path="/account/profile/:id" element={<Profile/>}/>
        <Route element={<ProtectedRoute forAuthRoute={true}/>}>
          <Route path="/account/control" element={<AccountsControl/>}/>
        </Route>
        <Route element={<ProtectedRoute forAuthRoute={true}/>}>
          <Route path="/content/control"element={<ContentControl/>}/>
        </Route>
        <Route path="*" element={<NotFound/>}/>
      </Routes>
      
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
library.add(fas, far)