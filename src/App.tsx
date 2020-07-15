// Two ways to get comments of live videos.
// Client side polling: able to retrieve older comments.
// https://developers.facebook.com/docs/graph-api/reference/live-video/comments/
// Real-time server side pushing: might drop comments if connection is lost.
// https://developers.facebook.com/docs/graph-api/server-sent-events/endpoints/live-comments/
// The former is used here.
// Requires two permissions from user: pages_read_engagement, pages_read_user_content
// https://developers.facebook.com/docs/facebook-login/permissions/#reference-pages_read_engagement

import React, { useEffect, useState } from "react";
import "./App.css";

interface User {
  id: string;
  name: string;
}

interface Page {
  id: string;
  name: string;
  access_token: string;
}

interface LiveVideo {
  id: string;
  title: string;
  description: string;
}

interface Comment {
  id: string;
  message: string;
  created_time: string;
  from: User | undefined;
}

interface FBResponse {
  data?: any;
  error?: any;
}

function App() {
  const [userId, setUserId] = useState<string>();
  const [userToken, setUserToken] = useState<string>();
  const [pageToken, setPageToken] = useState<string>();
  const [pages, setPages] = useState<Page[]>([]);
  const [liveVideos, setLiveVideos] = useState<LiveVideo[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);

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
      FB.Event.subscribe("auth.authResponseChange", (res) => {
        console.log("statuschange", res);
        setUserId(res.authResponse?.userID);
        setUserToken(res.authResponse?.accessToken);
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

  const getManagedPages = (userId: string) => {
    // https://developers.facebook.com/docs/graph-api/reference/user/accounts/
    return new Promise<Page[]>((resolve, reject) =>
      FB.api<object, FBResponse>(
        `/${userId}/accounts`,
        { fields: "id,name,access_token" },
        (res) => {
          console.log("pages", res);
          res.error ? reject(res.error) : resolve(res.data);
        }
      )
    );
  };

  const getPageLiveVideos = (pageId: string, pageToken: string) => {
    // https://developers.facebook.com/docs/graph-api/reference/page/live_videos/
    return new Promise<LiveVideo[]>((resolve, reject) =>
      FB.api<object, FBResponse>(
        `/${pageId}/live_videos`,
        {
          access_token: pageToken,
          broadcast_status: ["LIVE"],
          fields: "id,title,description",
        },
        (res) => {
          console.log("live videos", res);
          res.error ? reject(res.error) : resolve(res.data);
        }
      )
    );
  };

  const getLiveVideoComments = (videoId: string, pageToken: string) => {
    // https://developers.facebook.com/docs/graph-api/reference/live-video/comments/
    return new Promise<Comment[]>((resolve, reject) =>
      FB.api<object, FBResponse>(
        `/${videoId}/comments`,
        {
          access_token: pageToken,
          live_filter: "no_filter",
          order: "reverse_chronological",
          fields: "id,created_time,from,message",
        },
        (res) => {
          console.log("live video comments", res);
          res.error ? reject(res.error) : resolve(res.data);
        }
      )
    );
  };

  useEffect(() => {
    initFB();
  }, []);

  useEffect(() => {
    const getPages = async () => {
      if (userId) {
        const pages = await getManagedPages(userId);
        setPages(pages);
      } else {
        setPages([]);
      }
      setLiveVideos([]);
      setComments([]);
    };

    getPages();
  }, [userId, userToken]);

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
        // https://developers.facebook.com/docs/facebook-login/permissions/#reference-pages_read_engagement
        data-scope="pages_read_engagement,pages_read_user_content"
      ></div>
      <button
        onClick={() => {
          FB.login(() => {}, {
            scope: "pages_read_engagement,pages_read_user_content",
            auth_type: "rerequest",
          });
        }}
      >
        Grant permission to more/less pages
      </button>

      <h3>Pages</h3>
      <table>
        <thead>
          <tr>
            <th>Page Id</th>
            <th>Page Name</th>
            <th>Live Videos</th>
          </tr>
        </thead>
        <tbody>
          {pages.map((p) => (
            <tr key={p.id}>
              <td>{p.id}</td>
              <td>{p.name}</td>
              <td>
                <button
                  onClick={async () => {
                    const videos = await getPageLiveVideos(
                      p.id,
                      p.access_token
                    );
                    setPageToken(p.access_token);
                    setLiveVideos(videos);
                  }}
                >
                  Fetch
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3>Live Videos</h3>
      <table>
        <thead>
          <tr>
            <th>Video Id</th>
            <th>Video Title</th>
            <th>Video Description</th>
            <th>Comments</th>
          </tr>
        </thead>
        <tbody>
          {liveVideos.map((v) => (
            <tr key={v.id}>
              <td>{v.id}</td>
              <td>{v.title}</td>
              <td>{v.description}</td>
              <td>
                {pageToken && (
                  <button
                    onClick={async () => {
                      const comments = await getLiveVideoComments(
                        v.id,
                        pageToken
                      );
                      setComments(comments);
                    }}
                  >
                    Fetch
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3>Comments</h3>
      <table>
        <thead>
          <tr>
            <th>Comment Id</th>
            <th>Comment Message</th>
            <th>Created Time</th>
            <th>From</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {comments.map((c) => (
            <tr key={c.id}>
              <td>{c.id}</td>
              <td>{c.message}</td>
              <td>{c.created_time}</td>
              <td>
                {c.from?.name} ({c.from?.id})
              </td>
              <td>
                {c.message.includes("+1") && (
                  <button
                    onClick={() => {
                      alert(`+1 from ${c.from?.name || "unknown"}!`);
                    }}
                  >
                    Create Order
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default App;
