import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap/dist/js/bootstrap';
import { Provider, useDispatch } from 'react-redux';
import store from './redux/store';
import { CookiesProvider } from 'react-cookie';
import App from './App';
import { setMode } from './redux/modeSlice';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import Home from './components/pages/home';
import SignUp from './components/pages/signup';
import Login from './components/pages/login';
import AccountsControl from './components/pages/accountsControl/accountsControl';
import ContentControl from './components/pages/contentControl';
import Content from './components/pages/content/content';
import ResetPass from './components/pages/resetPass';
import ForgetPass from './components/pages/forgetPass';
import Profile from './components/pages/profile/profile';
import ProtectedRoute from './components/shared/protectedRoute';
import ProfileContent from './components/pages/profile/sections/profileContent';
import ProfileSetting from './components/pages/profile/sections/profileSetting';
import ProfileFavorite from './components/pages/profile/sections/profileFavorite';
import ErrorHandler from './components/pages/errorHandler';
import ProfileOverview from './components/pages/profile/sections/profileOverview';
import Loader from './components/shared/loader';

const router = createBrowserRouter([
    {
      path:'/',
      element: <App/>,
      errorElement: <ErrorHandler/>,
      children:[
        {
          index: true,
          loader: ()=>
            fetch(process.env.REACT_APP_API_SERVER, {credentials:"include"})
            .then(res=>{
              if(res.ok) return res
              else throw res
            }),
          element: <Home/>
        },
        {
          path: "content/id/:id",
          loader: ({params})=>
            fetch(process.env.REACT_APP_API_SERVER+"/content/id/"+params.id,{credentials: "include"})
            .then(res=>{
              if(res.ok) return res
              else throw res
            }),
          element: <Content/>
        },
        {
          path: "account/signup",
          element: <ProtectedRoute/>,
          children: [{
            index: true,
            element: <SignUp/>
          }]
        },
        {
          path: "account/login",
          element: <ProtectedRoute/>,
          children: [{
            index: true,
            element: <Login/>
          }]
        },
        {
          path: "account/reset/:id/:resetCode",
          element: <ResetPass/>
        },
        {
          path: "account/password-forgot",
          element: <ForgetPass/>
        },
        {
          path: "account/profile/:id",
          loader: ({params})=>
            fetch(process.env.REACT_APP_API_SERVER+"/account/profile/"+params.id, {credentials: "include"})
            .then(res=>{
              if(res.ok) return res.json()
              else throw res
            }).then(data=>{
              if(window.location.pathname.split("/").pop() === 'setting' && data.profileOwner)
                throw new Response(null, {status:403})
              return data
            }),
          element: <Profile/>,
          children: [
            {
              index: true,
              element: <ProfileOverview/>
            },
            {
                path: "content",
                loader: ({params})=> 
                  fetch(process.env.REACT_APP_API_SERVER+"/account/profile/"+params.id+"/content", {credentials: "include"})
                  .then(res=>{
                    if(res.ok) return res
                    else throw res
                  }),
                element: <ProfileContent/>
              },
              {
                path: "setting",
                element: <ProfileSetting/>
              },
              {
                path:"favorite",
                loader: ({params})=> 
                  fetch(process.env.REACT_APP_API_SERVER+"/content/favorite/account/"+params.id, {credentials: "include"})
                  .then(res=>{
                    if(res.ok) return res
                    else throw res
                  }),
                element: <ProfileFavorite/>
            }
          ]
        },
        {
          path: "account/control",
          element: <ProtectedRoute forAuthRoute={true}/>,
          children: [{
            index: true,
            loader: ()=> 
              fetch(process.env.REACT_APP_API_SERVER+"/account", {credentials:"include"})
              .then(res=>{
                if(res.ok) return res
                else throw res
              }),
            element: <AccountsControl/>
          }]
        },
        {
          path: "content/control",
          element: <ProtectedRoute forAuthRoute={true}/>,
          children: [{
            index: true,
            loader: ()=> 
              fetch(process.env.REACT_APP_API_SERVER+"/content/control", {credentials: "include"})
              .then(res=>{
                if(res.ok) return res
                else throw res
              }),
            element: <ContentControl/>
          }]
        }
      ]
    }
  ])

const storedMode = window.localStorage.getItem('mode');

const Handler = ()=>{
  const dispatch = useDispatch();
  useEffect(()=>{
    dispatch(setMode(storedMode? 
      storedMode === 'dark'? 'dark': 'light'
      : window.matchMedia('(prefers-color-scheme: dark)').matches? 'dark':'light'
    )) 
  }, [])

  return <RouterProvider router={router} fallbackElement={<Loader fallback={true}/>}/>
} 

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <Provider store={store}>
    <CookiesProvider>
      <Handler/>
    </CookiesProvider>
  </Provider>
);