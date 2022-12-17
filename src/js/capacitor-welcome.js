import { SplashScreen } from '@capacitor/splash-screen';
import { CapacitorHttp } from '@capacitor/core';

window.customElements.define(
  'capacitor-welcome',
  class extends HTMLElement {
    constructor() {
      super();

      SplashScreen.hide();

      const root = this.attachShadow({ mode: 'open' });

      root.innerHTML = `
        <style>
          :host {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
            display: block;
            width: 100%;
            height: 100%;
          }
          .button {
            display: inline-block;
            padding: 10px;
            background-color: #73B5F6;
            color: #fff;
            font-size: 0.9em;
            border: 0;
            border-radius: 3px;
            text-decoration: none;
            cursor: pointer;
          }
          .button.green {
            background-color: green;
          }
          .button.red {
            background-color: red;
          }
          main {
            padding: 15px;
          }
          main hr { height: 1px; background-color: #eee; border: 0; }
          main h1 {
            font-size: 1.4em;
            letter-spacing: 1px;
          }
          main h2 {
            font-size: 1.1em;
            border-top: 1px solid darkgrey;
            padding-top: 40px;
            margin-top: 40px;
          }
          main h3 {
            font-size: 0.9em;
          }
          main p {
            color: #333;
          }
          main pre {
            white-space: pre-line;
            border: 1px dashed darkgrey;
            padding: 10px;
            margin-bottom: 40px;
          }
        </style>
        <div>
          <capacitor-welcome-titlebar>
            <h1>Capacitor with HTTP Fetch</h1>
          </capacitor-welcome-titlebar>
          <main>
            <p>Read more about patching fetch with Capacitor HTTP <a href="https://capacitorjs.com/docs/apis/http" target="_blank">here</a></p>
            
            <p><b>NOTE: you have to run this demo as an Android or iOS Capacitor app.</b></p>



            <h2>DEMO 1: CapacitorHttp.request</h2>
            <p>This HTTP call uses <code>CapacitorHttp.request</code> directly, and can successfully hit a CORS protected endpoint.</p>
            <p><button class="button green" id="demo1-button">Fetch (works fine)</button></p>
            <pre id="demo1-output"></pre>
            
            <h2>DEMO 2: fetch(resource: string, options: object)</h2>
            <p>This HTTP call follows the below <code>fetch(resource: string, options: object)</code> and can successfully hit a CORS protected endpoint.</p>
            <p><button class="button green" id="demo2-button">Fetch (works fine)</button></p>
            <pre id="demo2-output"></pre>

            <h2>DEMO 3: fetch(resource: Request)</h2>
            <p>This HTTP call follows the below <code>fetch(resource: Request)</code> and fails with a CORS error.</p>
            <p><button class="button red" id="demo3-button">Fetch (will fail, but shouldn't)</button></p>
            <pre id="demo3-output"></pre>

            <h2>DEMO 4: Patch Fetch correctly, then call fetch(resource: Request)</h2>
            <p>This demo patches the window.fetch function to fix the issue, overriding the CapacitorHTTP patch, and then calls the <code>fetch(resource: Request)</code></p>
            <p><button class="button green" id="demo4-button">Fetch (works fine)</button></p>
            <pre id="demo4-output"></pre>
          </main>
        </div>
      `;
    }

    connectedCallback() {

      const self = this;

      // DEMO 1: Call CORS enabled API with Capacitor Http.request API.
      this.shadowRoot.querySelector('#demo1-button').addEventListener('click', async () => {

        this.shadowRoot.querySelector('#demo1-output').innerHTML = 'Loading...';

        try {

            const options = {
              url: 'https://www.google.com/search?q=NASDAQ:AAPL',
              headers: {
                'X-Fake-Header': 'Fake-Value'
              }
            };
          
            const response = await CapacitorHttp.get(options);

            this.shadowRoot.querySelector('#demo1-output').innerHTML = response.status;

            console.log('DEMO 1 - SUCCESS');

        } catch(error) {

          console.log('DEMO 1 - ERROR');

          this.shadowRoot.querySelector('#demo1-output').innerHTML = error.stack;
        }
      });

      // DEMO 2: Call CORS enabled API with fetch(resource: string, options: object) signature.
      this.shadowRoot.querySelector('#demo2-button').addEventListener('click', async () => {

        this.shadowRoot.querySelector('#demo2-output').innerHTML = 'Loading...';

        try {

          const response = await fetch('https://www.google.com/search?q=NASDAQ:AAPL', {
            headers: {
              'X-Fake-Header': 'Fake-Value'
            }
          });

          this.shadowRoot.querySelector('#demo2-output').innerHTML = await response.status;

          console.log('DEMO 2 - SUCCESS');

        } catch(error) {

          console.log('DEMO 2 - ERROR');

          this.shadowRoot.querySelector('#demo2-output').innerHTML = error.stack;
        }
      });

      // DEMO 3: Call CORS enabled API with fetch(resource: Request) signature.
      this.shadowRoot.querySelector('#demo3-button').addEventListener('click', async () => {

        this.shadowRoot.querySelector('#demo3-output').innerHTML = 'Loading...';

        try {

          const request = new Request('https://www.google.com/search?q=NASDAQ:AAPL', {
            headers: {
              'X-Fake-Header': 'Fake-Value'
            }
          });

          const response = await fetch(request);

          console.log('DEMO 3 - SUCCESS');

          this.shadowRoot.querySelector('#demo3-output').innerHTML = await response.status;

        } catch(error) {

          console.log('DEMO 3 - ERROR');

          this.shadowRoot.querySelector('#demo3-output').innerHTML = error.stack;
        }
      });

      // DEMO 4: Patch fetch and call fetch(resource: Request) signature
      this.shadowRoot.querySelector('#demo4-button').addEventListener('click', async () => {

        this.shadowRoot.querySelector('#demo4-output').innerHTML = 'Loading...';


        // Patch fetch the right way.
        window.fetch = async (
          resource,
          options
        ) => {
      
          // Parse the request arguments to a standard Request object, to support all fetch function signatures.
          const request = new Request(resource, options);
      
          if (
            !(
              request.url.startsWith('http:') ||
              request.url.startsWith('https:')
            )
          ) {
            return window.CapacitorWebFetch(resource, options);
          }
      
          try {
      
            // intercept request & pass to the bridge
            const nativeResponse = await CapacitorHttp.request({
              url: request.url,
              method: request.method,
              data: request.body,
              headers: Object.fromEntries(request.headers)
            });
      
            const data =
              typeof nativeResponse.data === 'string'
                ? nativeResponse.data
                : JSON.stringify(nativeResponse.data);
      
            // intercept & parse response before returning
            const response = new Response(data, {
              headers: nativeResponse.headers,
              status: nativeResponse.status
            });
      
            return response;
      
          } catch (error) {
      
            return Promise.reject(error);
          }
        };

        // Call the API fetch again.
        try {

          const response = await fetch('https://www.google.com/search?q=NASDAQ:AAPL', {
            headers: {
              'X-Fake-Header': 'Fake-Value'
            }
          });

          this.shadowRoot.querySelector('#demo4-output').innerHTML = await response.status;

          console.log('DEMO 4 - SUCCESS');

        } catch(error) {

          console.log('DEMO 4 - ERROR');

          this.shadowRoot.querySelector('#demo4-output').innerHTML = error.stack;
        }
      });
    }
  }
);

window.customElements.define(
  'capacitor-welcome-titlebar',
  class extends HTMLElement {
    constructor() {
      super();
      const root = this.attachShadow({ mode: 'open' });
      root.innerHTML = `
        <style>
          :host {
            position: relative;
            display: block;
            padding: 15px 15px 15px 15px;
            text-align: center;
            background-color: #73B5F6;
          }
          ::slotted(h1) {
            margin: 0;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
            font-size: 0.9em;
            font-weight: 600;
            color: #fff;
          }
        </style>
        <slot></slot>
    `;
    }
  }
);
