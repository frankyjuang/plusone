import React, { useEffect, useState } from "react";
import "./App.css";

function App() {
  const [accessToken, setAccessToken] = useState<string>();

  const initFB = () => {
    // @ts-ignore
    window.fbAsyncInit = function () {
      FB.init({
        appId: "201593587946994",
        cookie: true,
        status: true,
        xfbml: true,
        version: "v7.0",
      });
      FB.Event.subscribe("auth.statusChange", (res) => {
        console.log("statuschange", res);
        setAccessToken(res.authResponse?.accessToken);
      });
    };

    (function (d, s, id) {
      var js,
        fjs = d.getElementsByTagName(s)[0];
      if (d.getElementById(id)) {
        return;
      }
      js = d.createElement(s);
      js.id = id;
      // @ts-ignore
      js.src = "https://connect.facebook.net/en_US/sdk.js";
      // @ts-ignore
      fjs.parentNode.insertBefore(js, fjs);
    })(document, "script", "facebook-jssdk");
  };

  useEffect(() => {
    initFB();
  }, []);

  return (
    <div className="App">
      <div
        className="fb-login-button"
        data-size="large"
        data-button-type="login_with"
        data-layout="rounded"
        data-auto-logout-link="true"
        data-use-continue-as="true"
        data-width=""
      ></div>
      {accessToken}
    </div>
  );
}

export default App;
