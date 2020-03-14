var h = preact.h; // Shortcut for the preact's `h`
var App = {}; // App-specific namespace

var ouncesToLiter = function ouncesToLiter(oz) {
  return Number((oz * 0.0295735296875).toFixed(3));
};
var literToOunces = function literToOunces(liters) {
  return Number((liters / 0.0295735296875).toFixed(3));
};

/**
 * @param {any} object
 * @param {string[]} keys
 */

function recursive(object, keys, value) {
  var key = keys.splice(0, 1)[0];
  if (typeof object !== "object") {
    return value;
  }
  return Object.assign({}, object, { [key]: recursive(object[key], keys) });
}

/**
 * App.setKey sucks and doesn't update the app
 * so here goes
 * @param {(state) => void} setState
 * @param {string} keys
 * @param {any} value
 */

var setNestedState = function(setState, keys, value) {
  var allKeys = keys.split(".");
  setState(function(state) {
    recursive(state, allKeys, value);
  });
};

var removeUnNecessaryProps = function(data) {
  var dataToProcess = Object.assign({}, data);
  console.log(data);
  var keysToRemove = [
    "isKegSizeCustom",
    "isDrinkSizeCustom",
    "isServingSizeCustom"
  ];
  Object.keys(dataToProcess).forEach(function(nextKey) {
    keysToRemove.forEach(key => delete dataToProcess[nextKey][key]);
  });
  console.log(dataToProcess);

  return dataToProcess;
};

var curry = function() {
  var fns = Array.from(arguments);
  return function(val) {
    return fns.reduce(function(acc, nextFn) {
      return nextFn(acc);
    }, val);
  };
};

var litersToML = function(liters) {
  return liters * 1000;
};

var mLToLiters = function(mL) {
  return mL / 1000;
};

var millilitersToGallons = function(liters) {
  return Number(((liters * 0.26417) / 1000).toFixed(3));
};

var gallonsToMilliliters = function(gallons) {
  return Number(((gallons / 0.26417) * 1000).toFixed(3));
};

App.settings = {
  provisionURL: "http://192.168.4.1",
  mdashURL: "https://mdash.net",
  appID: "", // <-- Set this to YOUR_APP_ID
  callTimeoutMilli: 10000, // 10 seconds
  defaultSiteName: "NewSite",
  drinkSizes: {
    "1000": "Liter (1000 mL)",
    "500": "Half Liter (500 mL)",
    "651": "Bomber (651 mL)",
    "568": "UK Pint (568 mL)",
    "473": "US Pint (473 mL)",
    "355": "US Bottle (355 mL)",
    "0": "Custom"
  },
  drinkSizes_US: {
    "1000": "Liter (33.8oz)",
    "500": "Half Liter (16.9 oz)",
    "651": "Bomber (22.0 oz)",
    "568": "UK Pint (19.2 oz)",
    "473": "US Pint (16 oz)",
    "355": "US Bottle (12 oz)",
    "0": "Custom"
  },
  kegSizes: {
    "9464": "Half Corny (9.5L)",
    "18927": "Corny (18.9L)",
    "19550": "1/6 Barrel (19.6L)",
    "20000": "20L",
    "25000": "25L",
    "29340": "1/4 Barrel (29.3L)",
    "30000": "30L",
    "40915": "Firkin (40.9L)",
    "50000": "50L",
    "58670": "1/2 Barrel (58.7L)",
    "0": "Custom"
  },
  kegSizes_US: {
    "9464": "Half Corny (2.5gal)",
    "18927": "Corny (5.0gal)",
    "19550": "1/6 Barrel (5.2gal)",
    "20000": "20L (5.3gal)",
    "25000": "25L (6.6gal)",
    "29340": "1/4 Barrel (7.7gal)",
    // "30000": "7.9gal",
    "40915": "Firkin (10.8gal)",
    "50000": "50L (13.2gal)",
    "58670": "1/2 Barrel (15.5gal)",
    "0": "Custom"
  }
};

App.getCookie = function(name) {
  var v = document.cookie.match("(^|;) ?" + name + "=([^;]*)(;|$)");
  return v ? v[2] : "";
};

App.errorHandler = function(e) {
  var o = ((e.response || {}).data || {}).error || {};
  alert(o.message || e.message || e);
};

App.setKey = function(obj, key, val) {
  if (!isNaN(val)) {
    val = Number(val);
  }

  var parts = key.split(".");
  for (var i = 0; i < parts.length; i++) {
    if (i >= parts.length - 1) {
      // if (!isNaN(val)) val =+val;  // If val is a number, convert to number
      obj[parts[i]] = val;
    } else {
      if (!obj[parts[i]]) obj[parts[i]] = {};
      obj = obj[parts[i]];
    }
  }
};

App.getKey = function(obj, key) {
  var parts = key.split(".");
  for (var i = 0; i < parts.length; i++) {
    if (!(parts[i] in obj)) return undefined;
    obj = obj[parts[i]];
  }
  return obj;
};

App.websocket = function(url) {
  // var l = window.location, proto = l.protocol.replace('http', 'ws');
  // var wsURI = proto + '//' + l.host + l.pathname + uri;
  var wrapper = {
    shouldReconnect: true,
    close: function() {
      wrapper.shouldReconnect = false;
      wrapper.ws.close();
    }
  };
  var reconnect = function() {
    var msg,
      ws = new WebSocket(url);
    ws.onmessage = function(ev) {
      try {
        msg = JSON.parse(ev.data);
      } catch (e) {
        console.log("Invalid ws frame:", ev.data); // eslint-disable-line
      }
      if (msg) wrapper.onmessage(msg);
    };
    ws.onclose = function() {
      window.clearTimeout(wrapper.tid);
      if (wrapper.shouldReconnect) {
        wrapper.tid = window.setTimeout(reconnect, 1000);
      }
    };
    wrapper.ws = ws;
  };
  reconnect();
  return wrapper;
};

App.Header = function(props) {
  return h(
    "div",
    { class: "p-2 border-bottom bg-light header" },
    h(App.BackButton, props),
    h("b", {}, props.app.state.title),
    h(
      "div",
      { class: "float-right" },
      h(App.SpinButton, {
        class: "d-inline-block btn-sm ml-3 btn-warning font-weight-light",
        icon: "fa-sign-out",
        title: "logout",
        onClick: props.app.logout
      })
    )
  );
};

App.Footer = function(props) {
  var self = this,
    app = props.app;

  var mkTabButton = function(title, icon, tab, href) {
    var active = location.hash == href.replace(/.*#/, "#").replace(/\?.*/, "");
    return h(
      "a",
      {
        href: href,
        class:
          "text-center " +
          (active ? "font-weight-bold text-primary" : "text-dark"),
        style:
          "flex:1;height:3em;text-decoration:none;" +
          "border-top: 3px solid " +
          (active ? "#007bff" : "transparent")
      },
      h(
        "div",
        { class: "", style: "line-height: 1.4em" },
        h("i", { class: "mr-0 fa-fw fa " + icon, style: "width: 2em;" }),
        h("div", { class: "small" }, title)
      )
    );
  };

  var proto =
    location.href.indexOf("127.0.0.1") > 0
      ? "http"
      : App.settings.mdashURL.split(":")[0];
  var base = proto + "://" + location.host + location.pathname;
  var ibase = base.replace(/^https/, "http");

  return h(
    "footer",
    {
      class: "d-flex align-items-stretch border-top",
      style: "flex-shrink: 0;"
    },
    mkTabButton("Sites", "fa-home", App.PageSites, base + "#/"),
    mkTabButton(
      "Add Device",
      "fa-plus-circle",
      App.PageAddDevice,
      ibase + "#/add?access_token=" + app.state.u.token
    ),
    mkTabButton("Account", "fa-user", App.PageAccount, base + "#/account")
  );
};

App.SpinButton = function(props) {
  var self = this,
    state = self.state;
  self.componentDidMount = function() {
    self.setState({ spin: false });
  };
  return h(
    "button",
    {
      class: "btn " + (props.class || ""),
      disabled: props.disabled || state.spin,
      style: props.style || "",
      ref: props.ref,
      onClick: function() {
        if (!props.onClick) return;
        self.setState({ spin: true });
        props.onClick
          .apply(null, arguments)
          .catch(App.errorHandler)
          .then(function() {
            self.setState({ spin: false });
          });
      }
    },
    h("i", {
      class:
        "mr-1 fa fa-fw " +
        (state.spin ? "fa-refresh" : props.icon || "fa-save") +
        (state.spin ? " fa-spin" : "")
    }),
    props.title || "submit"
  );
};

App.Toggler = function(props) {
  var self = this,
    state = self.state;
  self.componentDidMount = function() {
    state.expanded = props.expanded || false;
  };
  var div = state.expanded
    ? props.children
    : props.dnone
    ? h("div", { class: "d-none" }, props.children)
    : null;
  return h(
    "span",
    { class: props.class || "", style: "z-index: 999;" },
    h(
      "a",
      {
        onClick: function(ev) {
          ev.preventDefault();
          self.setState({ expanded: !state.expanded });
        },
        href: "#"
      },
      props.text || "",
      h("i", {
        class:
          "ml-2 fa " + (state.expanded ? "fa-caret-down" : "fa-caret-right")
      })
    ),
    props.extra,
    div
  );
};

App.Login = function(props) {
  var self = this;
  self.componentDidMount = function() {
    self.setState({ email: "", pass: "" });
  };

  self.render = function(props, state) {
    return h(
      "div",
      {
        style: {
          width: "100%",
          height: "100%",
          backgroundColor: "#000"
        }
      },
      h(
        "div",
        {
          class: "mx-auto bg-light rounded",
          style: "max-width: 480px;"
        },
        // h("h3", { class: "text-center py-3 text-muted" }, "Kegtron Login"),
        h("img", {
          src: "images/Kegtron Cloud Dashboard - bw.png",
          class: "img-fluid"
        }),
        h(
          "div",
          { class: "form p-3 rounded w-100" },
          h("input", {
            type: "email",
            placeholder: "Email",
            class: "my-2 form-control",
            onInput: function(ev) {
              self.setState({ email: ev.target.value });
            }
          }),
          h("input", {
            type: "password",
            placeholder: "Password",
            class: "my-2 form-control",
            onInput: function(ev) {
              self.setState({ pass: ev.target.value });
            }
          }),
          h(App.SpinButton, {
            class: "btn-block btn-secondary",
            disabled: !state.email || !state.pass,
            title: "Sign In",
            style: {
              backgroundColor: "#000"
            },
            icon: "fa-sign-in",
            onClick: function() {
              var h = {
                Authorization: "Basic " + btoa(state.email + ":" + state.pass)
              };
              return axios
                .get(App.settings.mdashURL + "/customer", { headers: h })
                .then(function(res) {
                  props.app.login(res.data);
                  preactRouter.route("");
                })
                .catch(App.errorHandler);
            }
          }),
          h(
            "div",
            { class: "mt-2" },
            "No account yet? ",
            h(
              App.Toggler,
              { text: "Register", class: "black-text" },
              h(
                "div",
                {},
                h("input", {
                  type: "email",
                  placeholder: "Email",
                  class: "my-2 form-control",
                  onInput: function(ev) {
                    self.setState({ email: ev.target.value });
                  }
                }),
                h(App.SpinButton, {
                  class: "btn-block btn-secondary",
                  icon: "fa-envelope",
                  style: {
                    backgroundColor: "#000"
                  },
                  title: "Send invitation",
                  disabled: !state.email,
                  onClick: function() {
                    var app_id =
                      App.settings.appID ||
                      location.pathname.split("/")[2] ||
                      "setme";
                    var args = {
                      email: state.email,
                      url: App.settings.mdashURL,
                      from: "Kegtron",
                      redir: location.href,
                      app_id: app_id,
                      text:
                        "Thank you for registering with Kegtron.\n" +
                        "Your login: EMAIL\n" +
                        "Your password: PASS\n" +
                        "Click on the link below to activate your account " +
                        "and login:\nREGLINK"
                    };
                    return axios
                      .post(App.settings.mdashURL + "/invite", args)
                      .then(function(res) {
                        alert("Thank you! Check your inbox and login.");
                        self.setState({ email: "" });
                        location.reload();
                      })
                      .catch(App.errorHandler);
                  }
                })
              )
            )
          ),
          h(
            "div",
            { class: "mt-2" },
            h(
              "small",
              {},
              "By using this service, you agree to the ",
              h(
                "a",
                {
                  href: "https://policies.google.com/terms",
                  class: "black-text"
                },
                "terms"
              )
            )
          )
        )
      )
    );
  };
};

App.BackButton = function(props) {
  return h(
    "span",
    { class: "xbg-warning d-inline-block", style: "min-width: 7em;" },
    props.app.state.backlink
      ? h(
          "a",
          { href: props.app.state.backlink },
          h("i", { class: "fa fa-arrow-left mr-2" }),
          "back"
        )
      : h("img", { height: 24, src: "images/KegtronLogoBlack.png" })
  );
};

App.Graph = function(props) {
  var self = this;

  self.componentDidMount = function() {
    self.setState({ width: 400 });
  };

  self.ref = function(el) {
    if (el && el.clientWidth) self.setState({ width: el.clientWidth });
  };

  self.render = function(props, state) {
    var H = 280,
      W = state.width,
      ytics = 5,
      xtics = 5,
      bh = 25,
      th = 120;
    var grid = [],
      labels = [],
      points = [];
    var rows = props.data.reverse().map(function(row) {
      return { x: row.timestamp, y: row.level, vol: row.vol };
    });

    // Find value boundaries - max and min
    var max_y = Math.max.apply(
      null,
      rows.map(function(row) {
        return row.y || 0;
      })
    );
    var max_x = Math.max.apply(
      null,
      rows.map(function(row) {
        return row.x;
      })
    );
    var min_x = Math.min.apply(
      null,
      rows.map(function(row) {
        return row.x;
      })
    );
    if (max_x > 0)
      max_x = moment(max_x)
        .add(1, "hour")
        .startOf("hour");
    if (min_x > 0) min_x = moment(min_x).startOf("hour");
    if (moment.duration(max_x - min_x).asHours() < 2) {
      xtics = 6;
    } else {
      while (moment.duration(max_x - min_x).asHours() % xtics > 0) {
        min_x = min_x.add(-1, "hour");
      }
    }
    max_y = 100;

    // Setup grid - y axis
    for (var i = 0; i <= ytics; i++) {
      var y = (i * (H - bh - th)) / ytics;
      grid.push(["M", 0, y + th].join(" "));
      grid.push(["L", W, y + th].join(" "));
      if (rows.length == 0) continue;
      if (i < ytics)
        labels.push(
          h(
            "text",
            { x: 2, y: y + th + 9, class: "label" },
            ((ytics - i) * max_y) / ytics
          )
        );
    }

    for (var i = 0; i < xtics; i++) {
      var x = (i * W) / xtics;
      grid.push(["M", x, 0].join(" "));
      grid.push(["L", x, H - bh].join(" "));
      if (rows.length == 0) continue;
      var t = moment(min_x + ((max_x - min_x) * i) / xtics);
      labels.push(
        h(
          "text",
          { x: x + 2, y: H - 12, class: "label" },
          t.format("YYYY-DD-MM")
        )
      );
      labels.push(
        h("text", { x: x + 2, y: H - 2, class: "label" }, t.format("hh:mm:ss"))
      );
    }
    var mkx = function(x) {
      return parseInt((W * (x - min_x)) / (max_x - min_x) || 0);
    };
    var mky = function(y) {
      return parseInt((H - bh - th) * (1 - y / (max_y || 1)) || 0) + th;
    };

    var path = rows[0]
      ? ["M", mkx(rows[0].x), mky(rows[0].y)].join(" ")
      : "M 0 0";
    var stepx = W / (rows.length || 1);
    var points = rows.map(function(row, i) {
      return ["L", mkx(row.x), mky(row.y)].join(" ");
    });

    // Servings. Find max serving first
    var max_vol = Math.max.apply(
      null,
      rows.map(function(row) {
        return row.vol || 0;
      })
    );
    var servings = rows.map(function(row, i) {
      var x = mkx(row.x);
      var y = ((th * (row.vol || 1)) / (max_vol || 1)).toFixed(0);
      return ["M", x, th, "L", x, th - y].join(" ");
    });
    var srect = h("path", {
      d: "M 0 " + th + " L 0 0 L " + W + " 0",
      stroke: "#ccc"
    });

    var svg = h(
      "svg",
      { fill: "none", class: "h-100 w-100" },
      h(
        "style",
        {},
        ".label {fill: #777; font: italic 10px sans-serif;}" +
          ".title {fill: #555; font: bold 14px sans-serif;}"
      ),
      labels,
      srect,
      h("rect", {
        x: 0,
        y: th,
        width: W,
        height: H - th - bh,
        fill: "#fafafa"
      }),
      h("text", { x: 30, y: 20, stroke: "#aaa" }, "Serving History"),
      h("text", { x: 30, y: th + 20, stroke: "#aaa" }, "Volume History"),
      h("path", { d: servings.join(" "), stroke: "blue", "stroke-width": 7 }),
      h("path", { d: grid.join(" "), stroke: "#ccc", "stroke-width": 0.5 }),
      h("path", {
        d: path + points.join(" "),
        stroke: "#3cc",
        "stroke-width": 2
      })
    );

    return h(
      "div",
      { class: "w-100", style: "height: " + H + "px", ref: self.ref },
      svg
    );
  };
};

App.PageKeg = function(props) {
  var self = this;
  var dateFmt = "YYYY-MM-DD HH:MM";

  self.componentDidMount = function() {
    props.app.setState({
      title:
        "Sites / " + props.name + " / " + props.id + " / " + (+props.port + 1),
      backlink: "#/sites/" + props.name,
      refresh: false
    });
    self.setState({
      end: "now",
      start: moment()
        .add(-5, "days")
        .format(dateFmt)
    });
  };

  self.componentWillUnmount = function() {
    props.app.setState({ refresh: false });
    if (self.ws) self.ws.close();
  };

  self.componentWillReceiveProps = function(p) {
    var pubkey = App.getDevicePubkeyById(p.app, p.id);
    if (!pubkey) return;
    if (!self.ws) {
      var url =
        App.settings.mdashURL.replace(/^http/, "ws") +
        "/api/v2/m/device/notify" +
        "?access_token=" +
        pubkey;
      self.ws = App.websocket(url);
      self.ws.onmessage = function(m) {
        props.app.refresh();
      };
    }
    var d = p.app.state.devices[pubkey];
    self.setState({ pubkey: pubkey, d: d, data: [] });
    self.getServingHistory(pubkey);
  };

  self.getServingHistory = function(pubkey) {
    return axios
      .get(
        App.settings.mdashURL +
          "/api/v2/m/device/data/servings" +
          "?access_token=" +
          pubkey
      )
      .then(function(res) {
        var data = [];
        for (var i = 0; i < res.data.rows.length; i++) {
          var row = JSON.parse(res.data.rows[i][3]);
          //var device = res.data.rows[i][1];
          //console.log(device, props.port, row.port, props.port == row.port);
          if (row.port != props.port) continue;
          row.timestamp = moment.utc(res.data.rows[i][0]).local();
          data.push(row);
        }
        self.setState({ data: data });
      });
  };

  self.render = function(props, state) {
    var r = (((state.d || {}).shadow || {}).state || {}).reported || {};
    var c = r.config || {};
    var p = c["port" + props.port] || {};

    var mlToUnits = function(val) {
      if (c.displayUnits) {
        return +val + " mL"; // metric
      } else {
        return (+val * 0.033814).toFixed(1) + " oz";
      }
    };

    var mlToUnits2 = function(val) {
      return App.mlToUnits(val, c.displayUnits);
    };

    // Filter serving data by timestamps
    var start = moment(state.start, "YYYY-MM-DDThh:mm");
    var end = state.end == "now" ? moment().local() : state.end;
    var data = (state.data || []).filter(function(entry) {
      return (
        entry.timestamp.isAfter(moment(start)) &&
        entry.timestamp.isBefore(moment(end))
      );
    });

    var eventsTable = h(
      "div",
      { class: "table-responsive", style: "max-height: 15em;" },
      h(
        "table",
        { class: "table table-sm table-borderless small text-nowrap" },
        h(
          "tr",
          {},
          h("th", {}, "Timestamp"),
          h("th", {}, "Serving Size"),
          h("th", {}, "Level")
        ),
        data.map(function(row) {
          return h(
            "tr",
            {},
            h("td", {}, row.timestamp.format("YYYY-MM-DD HH:mm")),
            h("td", {}, mlToUnits(row.vol)),
            h("td", {}, (row.level || 0).toFixed(1), "%")
          );
        })
      )
    );

    var US = c.displayUnits;
    var temp = !US ? ((c.temp * 9) / 5.0 + 32).toFixed(1) : c.temp.toFixed(1);
    var pict = !US ? "\u2109" : "\u2103";

    var infoTable = h(
      "div",
      { class: "table-responsive" },
      h(
        "table",
        { class: "table table-sm table-borderless small" },
        h(
          "tr",
          {},
          h("td", {}, "Description"),
          h("th", { class: "text-right" }, p.userDesc)
        ),
        h(
          "tr",
          {},
          h("td", {}, "Status"),
          h(
            "th",
            {
              class: "text-right " + (r.online ? "text-success" : "text-danger")
            },
            r.online ? "online" : "offline"
          )
        ),
        h(
          "tr",
          {},
          h("td", {}, "Temperature"),
          h("th", { class: "text-right" }, temp, pict)
        ),
        h(
          "tr",
          {},
          h("td", {}, "Humidity"),
          h("th", { class: "text-right" }, c.humidity, "%")
        ),
        h(
          "tr",
          {},
          h("td", {}, "Model"),
          h("th", { class: "text-right" }, c.modelNum)
        ),
        h(
          "tr",
          {},
          h("td", {}, "Port"),
          h("th", { class: "text-right" }, +props.port + 1)
        ),
        h(
          "tr",
          {},
          h("td", {}, "Keg Size"),
          h("th", { class: "text-right" }, mlToUnits2(p.volSize))
        ),
        h(
          "tr",
          {},
          h("td", {}, "Starting Volume"),
          h("th", { class: "text-right" }, mlToUnits2(p.volStart))
        ),
        h(
          "tr",
          {},
          h("td", {}, "Last Cleaned"),
          h(
            "th",
            { class: "text-right" },
            p.dateCleaned ? moment(p.dateCleaned).fromNow() : "-"
          )
        ),
        h(
          "tr",
          {},
          h("td", {}, "Days on Tap"),
          h(
            "th",
            { class: "text-right" },
            moment(p.dateTapped || undefined)
              .fromNow()
              .replace(" ago", "")
          )
        ),
        h(
          "tr",
          {},
          h("td", {}, "Kegs Served"),
          h("th", { class: "text-right" }, p.kegsServed || 0)
        ),
        h(
          "tr",
          {},
          h("td", {}, "Volume Served"),
          h("th", { class: "text-right" }, mlToUnits2(p.volDisp))
        ),
        h(
          "tr",
          {},
          h("td", {}, "Last Serving"),
          h(
            "th",
            { class: "text-right" },
            data.length == 0 ? "-" : mlToUnits(data[0].vol)
          )
        )
      )
    );

    var W = 120,
      H = 240,
      left = p.volStart - p.volDisp || 0;
    if (p.volSize) left /= p.volSize;
    var H2 = (H - 20) * (left < 0 ? 0 : left),
      pc = (100 * left).toFixed(0) + "%";

    var info = h(
      "div",
      { class: "float-left mr-5", style: { margin: "auto" } },
      h(
        "svg",
        { class: "mr-2 bg-light", width: W, height: H },
        h("rect", {
          fill: "#333",
          x: 0,
          y: 0,
          width: W,
          height: H,
          rx: W / 10
        }),
        h("rect", {
          fill: "#79f",
          x: 10,
          y: H - H2 - 10,
          width: W - 20,
          height: H2
        }),
        h(
          "text",
          {
            "text-anchor": "middle",
            x: "50%",
            y: H / 2,
            fill: "#ff0",
            style: "font-weight: bold;font-size: 200%;"
          },
          pc
        )
      )
    );

    var graph = h(App.Graph, { data: data });
    var name = "Port " + (+props.port + 1) + ": " + (p.userName || "");
    var startFilteringInputValue = String(state.start).includes("T")
      ? state.start
      : moment(state.start).format("YYYY-MM-DDThh:mm");
    console.log(state.start);
    var endFilteringInputValue =
      state.end == "now"
        ? moment().format("YYYY-MM-DDThh:mm")
        : String(state.end).includes("T")
        ? state.end
        : moment(state.end).format("YYYY-MM-DDThh:mm");
    var graphToolbar = h(
      "div",
      { class: "form-inline" },
      h("span", { class: "mr-5" }, "Graph"),
      h("label", { class: "mr-2 small" }, "Start:"),
      h("input", {
        class: "form-control form-control-sm",
        type: "datetime-local",
        value: startFilteringInputValue,
        onChange: function(ev) {
          self.setState({ start: ev.target.value });
        }
      }),
      h("label", { class: "mx-2 small" }, "End:"),
      h("input", {
        class: "form-control form-control-sm",
        type: "datetime-local",
        value: endFilteringInputValue,
        onChange: function(ev) {
          self.setState({ end: ev.target.value });
        }
      })
    );

    return h(
      "div",
      { class: "overflow-auto p-2" },
      h(
        "div",
        { class: "font-weight-light card-deck" },
        h(
          "div",
          { class: "card my-2" },
          h("div", { class: "card-header font-weight-bold" }, name),
          h("div", { class: "card-body d-flex" }, info, infoTable)
        ),
        h(
          "div",
          { class: "card my-2" },
          h(
            "div",
            { class: "card-header font-weight-bold" },
            "Serving History"
          ),
          h("div", { class: "card-body" }, eventsTable)
        )
      ),
      h(
        "div",
        { class: "font-weight-light card-deck" },
        h(
          "div",
          { class: "card my-2" },
          h("div", { class: "card-header font-weight-bold" }, graphToolbar),
          h("div", { class: "card-body table-responsive" }, graph)
        )
      )
    );
  };
};

App.mlToUnits = function(val, isMetric) {
  if (isMetric) {
    return (val / 1000.0).toFixed(1) + " L";
  } else {
    return (val / 3785.41).toFixed(1) + " gal";
  }
};

App.KegLevel = function(keg) {
  return keg.volSize
    ? +((100 * (keg.volStart - keg.volDisp)) / keg.volSize).toFixed(1)
    : 0;
};

App.PageSite = function(props) {
  var self = this,
    state = self.state;
  self.componentDidMount = function() {
    props.app.setState({
      title: "Sites / " + props.name,
      backlink: "/",
      refresh: true
    });
    self.setState({ sortColumn: 2, direction: 1 });
  };
  self.componentWillUnmount = function() {
    props.app.setState({ refresh: false });
  };

  self.render = function(props, state) {
    var devices = props.app.state.devices,
      kegs = [];
    var mkdevices = function(k) {
      var d = devices[k],
        r = d.shadow.state.reported,
        c = r.config,
        name = c.siteName || App.settings.defaultSiteName;
      if (name != props.name) return;
      // for (var i = 0; i < c.portCount; i++) kegs.push({});
      for (var i = 0; i < c.portCount; i++) {
        c["port" + i].d = d;
        c["port" + i].port = i;
        c["port" + i].r = r;
        kegs.push(c["port" + i]);
      }
    };

    for (var k in devices) mkdevices(k);
    kegs.sort(function(a, b) {
      var l1 = a.userName,
        l2 = b.userName;
      if (state.sortColumn == 1) {
        l1 = a.r.online;
        l2 = b.r.online;
      } else if (state.sortColumn == 2) {
        l1 = App.KegLevel(a);
        l2 = App.KegLevel(b);
      } else if (state.sortColumn == 3) {
        l1 = a.volDisp;
        l2 = b.volDisp;
      } else if (state.sortColumn == 4) {
        l1 = a.volStart - a.volDisp;
        l2 = b.volStart - b.volDisp;
      } else if (state.sortColumn == 5) {
        if (a.drinkSize > 0) l1 = (a.volStart - a.volDisp) / a.drinkSize;
        if (b.drinkSize > 0) l2 = (b.volStart - b.volDisp) / b.drinkSize;
      } else if (state.sortColumn == 6) {
        l1 = a.volSize;
        l2 = b.volSize;
      }
      if (l1 == l2) return a.userName > b.userName ? 1 : -1;
      return l1 > l2 ? 1 * state.direction : -1 * state.direction;
    });

    var th = function(label, sortColumn, cls) {
      return h(
        "th",
        {
          style: sortColumn === undefined ? "" : "cursor: pointer;",
          class: cls || "",
          onClick: function(ev) {
            if (sortColumn === undefined) return;
            var direction =
              state.sortColumn == sortColumn ? state.direction * -1 : 1;
            self.setState({ sortColumn: sortColumn, direction: direction });
          }
        },
        label
      );
    };

    var table = h(
      "table",
      { class: "w-100 table table-borderless table-sm mt-2" },
      h(
        "tr",
        { class: "small border-bottom" },
        th("Name", 0),
        th("Status", 1),
        th("Level", 2, "w-25"),
        th("Vol Served", 3),
        th("Vol Remain", 4),
        th("Servings Remain", 5),
        th("Size", 6),
        h("th", {}, "")
      ),
      kegs.map(function(v) {
        var volLeft = v.volStart - v.volDisp;
        var lvl = App.KegLevel(v);
        var drinksLeft = v.drinkSize ? parseInt(volLeft / v.drinkSize) : 0;
        var bg = "";
        var r = v.r,
          c = r.config;

        var isMetric = r.config.displayUnits || 0;
        var mlToUnits = function(val) {
          return App.mlToUnits(val, isMetric);
        };

        if (c.lowThreshold > 0 && lvl < c.lowThreshold) bg = " bg-warning";
        if (c.emptyThreshold > 0 && lvl < c.emptyThreshold) bg = " bg-danger";
        if (lvl < 0) bg = " text-danger";
        var bar = h(
          "div",
          { class: "progress mt-1", style: "min-width: 8em;" },
          h(
            "div",
            {
              class: "progress-bar" + bg,
              style: "width:" + (lvl < 0 ? 0 : lvl) + "%",
              role: "progressbar"
            },
            h("span", { class: "px-2" }, lvl, "%")
          )
        );
        return h(
          "tr",
          {},
          h(
            "td",
            {},
            h(
              "a",
              { href: "#/sites/" + props.name + "/" + v.d.id + "/" + v.port },
              v.userName || "Port " + (v.port + 1)
            )
          ),
          h(
            "td",
            { class: r.online ? "text-success" : "text-danger" },
            h("b", {}, r.online ? "online" : "offline")
          ),
          h("td", {}, bar),
          h("td", {}, mlToUnits(v.volDisp)),
          h(
            "td",
            { class: volLeft <= 0 ? "bg-danger text-light" : "" },
            mlToUnits(volLeft)
          ),
          h(
            "td",
            { class: drinksLeft <= 0 ? "bg-danger text-light" : "" },
            drinksLeft
          ),
          h("td", {}, mlToUnits(v.volSize)),
          h(
            "td",
            {},
            h(
              "a",
              {
                href: "#/config/" + props.name + "/" + v.d.id + "/" + v.port
              },
              h("i", { class: "fa fa-cog" })
            )
          )
        );
      })
    );

    return h(
      "div",
      { class: "overflow-auto p-2" },
      h("div", { class: "h-100" }, table)
    );
  };
};

App.PageSites = function(props) {
  var self = this,
    state = self.state;
  self.componentDidMount = function() {
    props.app.setState({ title: "Sites", backlink: null, refresh: true });
  };
  self.componentWillUnmount = function() {
    props.app.setState({ refresh: false });
  };

  self.render = function(props, state) {
    var devices = props.app.state.devices,
      sites = {};
    for (var k in devices) {
      var d = devices[k],
        c = d.shadow.state.reported.config,
        name = c.siteName || App.settings.defaultSiteName;
      if (!sites[name]) sites[name] = { name: name, kegs: 0, low: 0, empty: 0 };
      sites[name].kegs += c.portCount || 0;
      for (var i = 0; i < c.portCount; i++) {
        var keg = c["port" + i];
        if (!keg) continue;
        var level = App.KegLevel(keg);
        if (level < c.emptyThreshold) {
          sites[name].empty++;
        } else if (level < c.lowThreshold) {
          sites[name].low++;
        }
      }
    }

    if (Object.keys(sites).length == 0)
      return h(
        "div",
        { class: "overflow-auto p-2" },
        h(
          "div",
          { class: "h-100 d-flex align-items-center" },
          h(
            "div",
            { class: "text-center w-100 text-muted font-weight-light" },
            h("i", { class: "fa fa-home fa-3x" }),
            h("br"),
            "No Sites"
          )
        )
      );

    var sites = Object.values(sites);
    sites.sort(function(a, b) {
      return a.name > b.name ? 1 : -1;
    });

    var table = h(
      "table",
      { class: "w-100 table table-borderless table-sm" },
      h(
        "thead",
        {},
        h(
          "tr",
          { class: "small border-bottom text-center" },
          h("th", { scope: "col", class: "text-left" }, "Site"),
          h("th", { scope: "col" }, "Kegs"),
          h("th", { scope: "col" }, "Low"),
          h("th", { scope: "col" }, "Empty")
        )
      ),
      h(
        "tbody",
        {},
        sites.map(function(v) {
          return h(
            "tr",
            { class: "text-center" },
            h(
              "td",
              { class: "text-left" },
              h("a", { href: "#/sites/" + v.name }, v.name)
            ),
            h("td", { style: { width: "25%" } }, v.kegs),
            h(
              "td",
              {
                style: { width: "25%" },
                class: v.low <= 0 ? "" : "bg-warning"
              },
              v.low
            ),
            h(
              "td",
              {
                style: { width: "25%" },
                class: v.empty <= 0 ? "" : "bg-danger"
              },
              v.empty
            )
          );
        })
      )
    );
    return h("div", { class: "overflow-auto p-2 table-responsive" }, table);
  };
};

App.PageAccount = function(props) {
  var self = this;
  self.componentDidMount = function() {
    props.app.setState({ title: "Account", backlink: null });
    self.setState({ pass: "", pass2: "" });
  };
  self.render = function(props, state) {
    return h(
      "div",
      { class: "overflow-auto p-2 font-weight-light" },
      h("div", { class: "px-2 my-2" }, h("b", {}, "Change password")),
      h("hr"),
      h(
        "form",
        { class: "form px-2" },
        h(
          "div",
          { class: "form-group row my-2" },
          h("label", { class: "col-form-label col-4" }, "Password"),
          h(
            "div",
            { class: "col-8" },
            h("input", {
              type: "password",
              value: state.pass,
              placeholder: "Type password",
              class: "form-control",
              onInput: function(ev) {
                self.setState({ pass: ev.target.value });
              }
            })
          )
        ),
        h(
          "div",
          { class: "form-group row my-2" },
          h("label", { class: "col-form-label col-4" }, "Retype password"),
          h(
            "div",
            { class: "col-8" },
            h("input", {
              type: "password",
              value: state.pass2,
              placeholder: "Type password",
              class: "form-control",
              onInput: function(ev) {
                self.setState({ pass2: ev.target.value });
              }
            })
          )
        ),
        h(App.SpinButton, {
          class: "btn-block btn-primary mt-3",
          disabled: !state.pass || !state.pass2 || state.pass != state.pass2,
          icon: "fa-save",
          title: "Change password",
          onClick: function() {
            var ok = confirm("Sure to update your password?");
            if (!ok) return Promise.resolve();
            var url =
              App.settings.mdashURL +
              "/customer?access_token=" +
              encodeURIComponent(props.app.state.u.token);
            var data = { password: state.pass };
            return axios({ method: "POST", url: url, data: data })
              .catch(function() {})
              .then(function() {
                setTimeout(props.app.refresh, 250);
              });
          }
        })
      )
    );
  };
};

App.PageAddDevice = function(props) {
  var self = this;

  self.componentDidMount = function() {
    props.app.setState({ title: "Add Device" });
    self.setState({ step: 0, ssid: "", pass: "", public_key: "" });
  };

  self.componentWillUnmount = function() {
    self.unmounted = true;
  };

  self.render = function(props, state) {
    var alertClass = "p-2 text-muted font-weight-light lead";
    var Step0 = h(
      "div",
      {},
      h(
        "div",
        { class: alertClass + "" },
        "Go to your phone settings",
        h("br"),
        "Join WiFi network Kegtron-XXXX",
        h("br"),
        "Return to this screen and press the Scan button"
      ),
      h(App.SpinButton, {
        class: "btn-block btn-primary border font-weight-light",
        title: "Scan",
        icon: "fa-search",
        onClick: function() {
          return new Promise(function(resolve, reject) {
            var attempts = 0;
            var f = function() {
              var error = function(err) {
                if (!self.unmounted) setTimeout(f, 500);
              };
              var success = function(res) {
                var key = res.data.result;
                if (key) {
                  self.setState({ step: 1, public_key: key });
                  resolve();
                } else {
                  reject(res.data.error);
                }
              };

              axios({
                url: App.settings.provisionURL + "/GetKey",
                timeout: App.settings.callTimeoutMilli
              }).then(success, error);
              attempts++;
              console.log("attempt", attempts);
            };
            f();
          });
        }
      })
    );

    var Step1 = h(
      "div",
      {},
      h(
        "a",
        {
          href: location.href,
          class: "link text-decoration-none",
          onClick: function() {
            self.setState({ step: 0 });
          }
        },
        "\u2190",
        " back"
      ),
      h("div", { class: alertClass + " mt-2" }, "Found new device!"),
      h("input", {
        class: "form-control mb-2",
        type: "text",
        placeholder: "WiFi network name",
        onInput: function(ev) {
          self.setState({ ssid: ev.target.value });
        }
      }),
      h("input", {
        class: "form-control mb-2",
        type: "text",
        placeholder: "WiFi password",
        onInput: function(ev) {
          self.setState({ pass: ev.target.value });
        }
      }),
      h(App.SpinButton, {
        class: "btn-block btn-primary font-weight-light",
        title: "Configure device WiFi",
        icon: "fa-save",
        disabled: !state.ssid,
        onClick: function() {
          var data = JSON.stringify({ ssid: state.ssid, pass: state.pass });
          return axios({
            method: "POST",
            url: App.settings.provisionURL + "/setup",
            timeout: App.settings.callTimeoutMilli,
            data: data
          }).then(function(res) {
            if (res.data.result) {
              self.setState({ step: 2 });
            } else {
              alert("Error: " + res.data.error);
            }
          });
        }
      })
    );

    var Step2 = h(
      "div",
      {},
      h(
        "a",
        {
          href: location.href,
          class: "link text-decoration-none",
          onClick: function() {
            self.setState({ step: 1 });
          }
        },
        "\u2190",
        " back"
      ),
      h(
        "div",
        { class: alertClass + " mt-2" },
        "WiFi configuration applied. ",
        "Go to your phone settings,",
        h("br"),
        "Join back to your WiFi network,",
        h("br"),
        "Return to this screen and click on Register Device."
      ),
      h(App.SpinButton, {
        class: "btn-block btn-primary border font-weight-light",
        title: "Register Device",
        icon: "fa-plus-circle",
        onClick: function() {
          var url =
            App.settings.mdashURL +
            "/customer?access_token=" +
            props.app.state.u.token;
          return axios
            .get(url)
            .then(function(res) {
              var data = res.data;
              if (!data.pubkeys) data.pubkeys = {};
              data.pubkeys[self.state.public_key] = {};
              return axios({ method: "POST", url: url, data: data });
            })
            .then(function(res) {
              // Go back to https, now with a registered device
              location.href = "https://" + location.host + location.pathname;
            })
            .catch(function(err) {
              alert(
                "Error registering device (" +
                  err +
                  "). Join your WiFi network and retry."
              );
            });
        }
      })
    );
    var steps = [Step0, Step1, Step2];

    return h("div", { class: "overflow-auto p-2" }, steps[state.step]);
    // return h('div', {class: 'overflow-auto p-2'}, 'hi');
  };
};

App.getDevicePubkeyById = function(app, id) {
  for (var k in app.state.devices) {
    var d = app.state.devices[k];
    if (d.id == id) return k;
  }
  return null;
};

var Modal = function Modal(_ref) {
  var open = _ref.open,
    children = _ref.children;
  return h(
    preactPortal,
    {
      into: "body"
    },
    h(
      "div",
      {},
      h(
        "div",
        {
          class: "modal fade" + (open ? " show" : ""),
          style: { display: open ? "block" : "none" }
        },
        children
      ),
      open
        ? h("div", { class: "modal-backdrop fade" + (open ? " show" : "") })
        : null
    )
  );
};

/**
 * @param props {{onSubmit: () => void; measuredServing: string }}
 */
var CalibrationAssistant = function(props) {
  var self = this;
  var state = self.state;

  var openAssistant = function(e) {
    e.stopPropagation();
    e.preventDefault();
    self.setState({
      assistantOpen: true
    });
    return Promise.resolve();
  };
  var closeAssistant = function() {
    self.setState({
      assistantOpen: false
    });
  };

  return h(
    "div",
    { class: "col-8" },
    h(App.SpinButton, {
      class: "btn-block btn-info",
      icon: "fa-external-link",
      title: "Open Calibration Assistant",
      type: "button",
      onClick: openAssistant
    }),
    h(
      Modal,
      {
        open: self.state.assistantOpen
      },
      h(
        "div",
        {
          class: "modal-dialog",
          role: "document"
        },
        h(
          "div",
          {
            class: "modal-content"
          },
          h(
            "div",
            {
              class: "modal-header"
            },
            h(
              "h5",
              {
                class: "modal-title",
                id: "exampleModalLabel"
              },
              "Calibration Assistant"
            ),
            h(
              "button",
              {
                type: "button",
                class: "close",
                "data-dismiss": "modal",
                "aria-label": "Close",
                onClick: closeAssistant
              },
              h(
                "span",
                {
                  "aria-hidden": "true"
                },
                "\xD7"
              )
            )
          ),
          h(
            "div",
            {
              class: "modal-body form"
            },
            h(
              "div",
              { class: "form-group row my-2" },
              h(
                "label",
                { class: "col-form-label col-6" },
                "Measured Serving:"
              ),
              h(
                "div",
                { class: "col-6" },

                h("input", {
                  class: "form-control",
                  disabled: true,
                  value: "volume/unit"
                })
              )
            ),
            h(
              "div",
              { class: "form-group row my-2" },
              h(
                "label",
                { class: "col-form-label col-6" },
                "Actual Serving (unit):"
              ),
              h(
                "div",
                { class: "col-6" },

                h("input", {
                  class: "form-control",
                  type: "text"
                })
              )
            ),
            h(
              "div",
              { class: "form-group row my-2" },
              h("label", { class: "col-form-label col-6" }, "Difference:"),
              h(
                "div",
                { class: "col-6" },

                h("input", {
                  class: "form-control",
                  disabled: true,
                  value: "difference/unit"
                })
              )
            ),
            h(
              "div",
              { class: "form-group row my-2" },
              h("label", { class: "col-form-label col-6" }, "Offset"),
              h(
                "div",
                { class: "col-6" },

                h("input", {
                  class: "form-control",
                  disabled: true,
                  value: "offset%"
                })
              )
            )
          ),
          h(
            "div",
            {
              class: "modal-footer"
            },
            h(
              "button",
              {
                type: "button",
                class: "btn btn-secondary",
                onClick: closeAssistant
              },
              "Close"
            ),
            h(
              "button",
              {
                type: "button",
                class: "btn btn-primary"
              },
              "Apply"
            )
          )
        )
      )
    )
  );
};

var AlertModal = function(props) {
  var closeModal = function() {
    props.onClose();
  };
  return (
    props.open &&
    h(
      Modal,
      {
        open: true
      },
      h(
        "div",
        {
          class: "modal-dialog",
          role: "document"
        },
        h(
          "div",
          {
            class: "modal-content"
          },
          h(
            "div",
            {
              class: "modal-header"
            },
            h(
              "h5",
              {
                class: "modal-title",
                id: "exampleModalLabel"
              },
              "Alert"
            )
          ),
          h(
            "div",
            {
              class: "modal-body"
            },
            h("p", { class: "lead" }, props.children)
          ),
          h(
            "div",
            {
              class: "modal-footer"
            },
            h(
              "button",
              {
                type: "button",
                class: "btn btn-primary mx-auto btn-lg",
                onClick: closeModal
              },
              "OK"
            )
          )
        )
      )
    )
  );
};

var MkRowInput = function(props) {
  var stringToString = function(s) {
    return s;
  };
  var self = this;
  self.componentDidMount = function() {
    // adding to the instance would improve performance
    self.normalize = props.normalize || stringToString;
    self.format = props.format || stringToString;

    self.setState({ value: self.normalize(props.value) });
  };
  self.componentWillReceiveProps = function(newProps) {
    self.normalize = newProps.normalize || stringToString;
    self.format = newProps.format || stringToString;

    if (self.props.value !== newProps.value)
      self.setState({ value: self.normalize(newProps.value) });
  };

  var handleInput = function(e) {
    self.setState({ value: e.target.value });
    props.onInput(self.format(e.target.value));
  };

  return h(
    "input",
    Object.assign({}, props, {
      type: props.type || "text",
      value: self.state.value,
      onInput: handleInput
    })
  );
};
/**
 * @typedef {(currentValue: string) => string} stringReturningFn
 * @typedef {{(key: string, value: string) => void}} changeFn
 *
 * @param {string} label - input label
 * @param {string} k - input property name in state
 * @param {{
 * type: string,
 * disabled: boolean,
 * onChange: changeFn,
 * normalize?: stringReturningFn,
 * format?: stringReturningFn,
 * }} extraProps
 *
 * normalize function if provided it would format
 * the input value displayed
 *
 * format would format that value to be put in state
 *
 *
 */
var mkrow = function({ label, k, extraProps, badge, onChange, valueResolver }) {
  var self = this;
  self.componentDidMount = function() {
    extraProps = extraProps || {};
    self.setState({ value: valueResolver(k, extraProps.type) });
  };
  self.componentWillReceiveProps = function() {
    extraProps = extraProps || {};
    var newValue = valueResolver(k, extraProps.type);
    if (newValue !== self.state.value) {
      self.setState({ value: newValue });
    }
  };
  return h(
    "div",
    { class: "form-group row my-2" },
    h("label", { class: "col-form-label col-4" }, label),
    h(
      "div",
      { class: badge ? "col-3" : "col-8" },
      h(
        MkRowInput,
        Object.assign({}, extraProps, {
          value: self.state.value,
          placeholder: label,
          // disabled: !!dis || !r.online,
          class: "form-control",
          onInput: function(term) {
            // onChange("innerData." + k, term);
            onChange("c." + k, term);
            if (k.match(/.volSize$/)) {
              // If user changes volSize, automatically set volStart
              // to the same value. Allow, however, overwriting
              // volStart manually.
              var k2 = k.replace(".volSize", ".volStart");
              // onChange("innerData." + k2, term);
              onChange("c." + k2, term);
            }
          }
        })
      )
    ),
    badge ? h("div", { class: "col-1 d-flex align-items-center" }, badge) : null
  );
};

App.PageSettings = function(props) {
  var self = this;
  self.componentDidMount = function() {
    var p = self.props;
    p.app.setState({
      title: "Settings / " + p.name + " / " + p.id + " / " + (+props.port + 1),
      backlink: "/sites/" + p.name
    });
    self.setState({});

    self.handleMkRowChange = function(key, value) {
      self.setNestedState(key, value);
      App.setKey(self.state, key, value);
    };

    self.mkRowValueResolver = function(k, type) {
      var r = self.state.d.shadow.state.reported;

      var value = App.getKey(self.state.c, k);
      if (value === undefined) value = App.getKey(r.config, k);
      // if (!value && isNaN(value)) value = '';

      value = type === "date" ? value.replace(/\//g, "-") : value;
      return value;
    };
    self.setNestedState = setNestedState.bind(null, self.setState.bind(self));
    self.onAutoKegReset = function(v) {
      self.setState({
        autoKegResetAlertOpen: v == 1
      });
    };
    self.closeAutoKegResetModal = function() {
      self.setState({
        autoKegResetAlertOpen: false
      });
    };
  };
  self.componentWillReceiveProps = function(p, oldprops) {
    var pubkey = App.getDevicePubkeyById(p.app, p.id);
    if (!pubkey) return;
    var d = p.app.state.devices[pubkey];

    self.setState({
      pubkey: pubkey,
      c: {},
      d: d
      // please do not modify this field at all
      // or use it
      // it is used to reflect some fields into
      // others, meaning the fields used to be outside react cycle
      // this ensures it is also inside
      // it should hold all the data and take changes
      // innerData: self.state.innerData || d.shadow.state.reported
    });
  };

  self.render = function(props, state) {
    if (!state.d)
      return h(
        "div",
        { class: "py-2 border-bottom" },
        h(
          "div",
          { class: "h-100 d-flex align-items-center" },
          h(
            "div",
            { class: "text-center w-100 text-muted" },
            h("i", { class: "fa fa-refresh fa-spin fa-2x" }),
            h("br"),
            "Initialising device..."
          )
        )
      );

    var r = state.d.shadow.state.reported;
    r.config.chipID = ((r.ota || {}).id || "").toUpperCase();
    var displayUnitIsMetric =
      (state.c.displayUnits !== undefined
        ? state.c.displayUnits
        : r.config.displayUnits) !== 0;

    var drinkSizes = App.settings.drinkSizes;
    var drinkSizes_US = App.settings.drinkSizes_US;
    var localizedDrinkSizes = displayUnitIsMetric ? drinkSizes : drinkSizes_US;
    var drinkSizesArray = Object.keys(localizedDrinkSizes).map(function(key) {
      return { value: Number(key), title: localizedDrinkSizes[key] };
    });
    var drinkSizeIsCustom = function(drinkSizes, drinkSize) {
      return (
        drinkSize == 0 ||
        drinkSizes.every(function(sz) {
          return String(sz.value) !== String(drinkSize);
        })
      );
    };
    var kegSizeIsCustom = function(kegSizes, kegSize) {
      return (
        kegSize == 0 ||
        kegSizes.every(function(sz) {
          return String(sz.value) !== String(kegSize);
        })
      );
    };
    drinkSizesArray = drinkSizesArray.sort(function(a, b) {
      return +a.value < +b.value ? 1 : -1;
    });
    var kegSizes = App.settings.kegSizes;
    var kegSizes_US = App.settings.kegSizes_US;

    var localizedKegSizes = displayUnitIsMetric ? kegSizes : kegSizes_US;

    var kegSizesArray = Object.keys(localizedKegSizes).map(function(key) {
      return { value: Number(key), title: localizedKegSizes[key] };
    });
    kegSizesArray.sort(function(a, b) {
      return +a.value < +b.value ? 1 : -1;
    });
    var mkDropdownRow = function(label, k, options, onChange) {
      var value = App.getKey(state.c, k);
      // console.log(value, state.c.kegSizesArray);
      if (value === undefined) value = App.getKey(r.config, k);
      // if(value===undefined) value=0;
      // so hey you value...
      // I was thinking, if you were a keg
      // how about we check if you're formatted correctly eh?
      if (k.match(/volSize$/)) {
        value = Number(value);
        // I know drinking gets crazy but
        // if you're not a keg size
        // then you're nothing to me!
        if (!(value in localizedKegSizes)) {
          // ah much better logic
          value = 0;
        }
      } else if (k.match(/drinkSize$/) && !(value in drinkSizes)) {
        value = 0;
      }

      // console.log(k, value);
      return h(
        "div",
        { class: "form-group row my-2" },
        h("label", { class: "col-form-label col-4" }, label),
        h(
          "div",
          { class: "col-8" },
          h(
            "select",
            {
              class: "form-control",
              type: "text",
              value: value,
              onChange: function(ev) {
                var v = ev.target.value;
                // if(state.c.displayUnits){
                //   v=v*0.264172;
                // }
                App.setKey(state.c, k, v);
                if (onChange) onChange(v);
                self.setState(state);
              }
            },
            options.map(function(o) {
              return h("option", { value: o.value }, o.title);
            })
          )
        )
      );
    };

    portconfigs = [];
    var mkportform = function(i) {
      var ind = "port" + i;

      var dskey = ind + ".drinkSize";
      var ss = App.getKey(state.c, dskey);
      if (ss === undefined) ss = App.getKey(r.config, dskey);
      var isServingSizeCustom = !ss || !drinkSizes[ss];

      var kskey = ind + ".volSize";
      var ks = App.getKey(state.c, kskey);
      if (ks === undefined) ks = App.getKey(r.config, kskey);
      var isKegSizeCustom = !ks || !kegSizes[ks];

      // If we select keg size in the dropdown, set vol start too
      var onk = function(v) {
        App.setKey(state.c, ind + ".volStart", v);
        if (v == 0) {
          App.setKey(state.c, ind + ".isKegSizeCustom", 1);
        } else {
          App.setKey(state.c, ind + ".isKegSizeCustom", 0);
        }
        self.setState(state);
      };
      //If we select drink size.
      var ond = function(v) {
        if (v == 0) {
          App.setKey(state.c, ind + ".isDrinkSizeCustom", 1);
        } else {
          App.setKey(state.c, ind + ".isDrinkSizeCustom", 0);
        }
        self.setState(state);
      };

      var formatAndNormalizeDrinkSizes = {
        format: !displayUnitIsMetric
          ? curry(litersToML, ouncesToLiter, Math.round.bind(Math))
          : Math.round.bind(Math),
        normalize: !displayUnitIsMetric
          ? curry(mLToLiters, literToOunces, Math.round.bind(Math))
          : Math.round.bind(Math)
      };
      var formatAndNormalizeKegSizes = {
        format: !displayUnitIsMetric
          ? curry(gallonsToMilliliters, Math.round.bind(Math))
          : curry(litersToML, Math.round.bind(Math)),
        normalize: !displayUnitIsMetric
          ? curry(millilitersToGallons, Math.round.bind(Math))
          : curry(mLToLiters, Math.round.bind(Math))
      };

      // console.log(i, ss);
      portconfigs.push(
        h(
          "div",
          {},
          h(
            "div",
            {
              style: {
                fontWeight: "bold",
                fontSize: "24px",
                marginBottom: "16px"
              }
            },
            h("hr"),
            "Port ",
            i + 1
          ),
          h(mkrow, {
            onChange: self.handleMkRowChange,
            valueResolver: self.mkRowValueResolver,
            label: "Name",
            key: ind + ".userName",
            k: ind + ".userName"
          }),
          h(mkrow, {
            onChange: self.handleMkRowChange,
            valueResolver: self.mkRowValueResolver,
            label: "Description",
            key: ind + ".userDesc",
            k: ind + ".userDesc"
          }),
          // mkrow('Volume Size,ml', ind + '.volSize'),
          mkDropdownRow("Keg Size", ind + ".volSize", kegSizesArray, onk),
          kegSizeIsCustom(
            kegSizesArray,
            App.getKey(state.c, ind + ".volSize") === undefined
              ? App.getKey(r.config, ind + ".volSize")
              : App.getKey(state.c, ind + ".volSize")
          )
            ? h(mkrow, {
                onChange: self.handleMkRowChange,
                valueResolver: self.mkRowValueResolver,
                label: "",
                k: ind + ".volSize",
                key: ind + ".volSize",
                badge: displayUnitIsMetric ? "L" : "gal",
                extraProps: formatAndNormalizeKegSizes
              })
            : null,
          h(mkrow, {
            onChange: self.handleMkRowChange,
            valueResolver: self.mkRowValueResolver,
            label:
              "Keg Volume Start " + (displayUnitIsMetric ? "(L)" : "(gal)"),
            k: ind + ".volStart",
            key: ind + ".volStart",
            extraProps: formatAndNormalizeKegSizes
          }),
          mkDropdownRow(
            "Serving Size",
            ind + ".drinkSize",
            drinkSizesArray,
            ond
          ),

          drinkSizeIsCustom(
            drinkSizesArray,
            App.getKey(state.c, ind + ".drinkSize") === undefined
              ? App.getKey(r.config, ind + ".drinkSize")
              : App.getKey(state.c, ind + ".drinkSize")
          )
            ? h(mkrow, {
                onChange: self.handleMkRowChange,
                valueResolver: self.mkRowValueResolver,
                label: "",
                k: ind + ".drinkSize",
                key: ind + ".drinkSize",
                badge: displayUnitIsMetric ? "mL" : "oz",
                extraProps: formatAndNormalizeDrinkSizes
              })
            : null,
          h(mkrow, {
            onChange: self.handleMkRowChange,
            valueResolver: self.mkRowValueResolver,
            label: "Cal. Offset %",
            k: ind + ".calOffset",
            key: ind + ".calOffset"
          }),
          h(
            "div",
            { class: "form-group row my-2" },
            h(
              "label",
              { class: "col-form-label col-4" },
              "Calibration Assistant"
            ),
            h(CalibrationAssistant)
          ),
          h(mkrow, {
            onChange: self.handleMkRowChange,
            valueResolver: self.mkRowValueResolver,
            label: "Date Tapped",
            k: ind + ".dateTapped",
            key: ind + ".dateTapped",
            extraProps: { type: "date" }
          }),
          h(mkrow, {
            onChange: self.handleMkRowChange,
            valueResolver: self.mkRowValueResolver,
            label: "Date Cleaned",
            k: ind + ".dateCleaned",
            key: ind + ".dateCleaned",
            extraProps: { type: "date" }
          }),
          h(
            "div",
            { class: "form-group row my-2" },
            h("label", { class: "col-form-label col-4" }, "Volume Reset"),
            h(
              "div",
              { class: "col-8" },
              h(App.SpinButton, {
                class: "btn-block btn-warning",
                icon: "fa-minus-square",
                title: "Reset Keg Volume",
                onClick: function() {
                  var ok = confirm("Sure to reset this volume?");
                  if (!ok) return Promise.resolve();
                  var url =
                    App.settings.mdashURL +
                    "/api/v2/m/device/rpc/Kegtron.ResetVolume" +
                    "?access_token=" +
                    encodeURIComponent(state.pubkey);
                  return axios({ method: "POST", url: url, data: { port: i } })
                    .then(function() {
                      // Reset dateTapped and dateCleaned
                      url = url.replace("/rpc/Kegtron.ResetVolume", "");
                      var c = {};
                      c["port" + i] = {
                        dateCleaned: null,
                        dateCleaned: null
                      };
                      var data = {
                        shadow: { state: { desired: { config: c } } }
                      };
                      return axios({ method: "POST", url: url, data: data });
                    })
                    .catch(function() {})
                    .then(function() {
                      setTimeout(props.app.refresh, 250);
                    });
                }
              })
            )
          )
        )
      );
    };
    for (var i = 0; i < r.config.portCount; i++) mkportform(i);

    return h(
      "div",
      { class: "overflow-auto p-2 font-weight-light" },
      h(
        "div",
        { class: "px-2 my-2" },
        state.d.id,
        ": ",
        h(
          "b",
          {
            class: r.online
              ? "text-success font-weight-bold"
              : "font-weight-bold text-danger"
          },
          r.online ? "online" : "offline"
        )
      ),
      h("hr"),
      h(
        "form",
        { class: "form px-2" },
        h(mkrow, {
          onChange: self.handleMkRowChange,
          valueResolver: self.mkRowValueResolver,
          label: "Site Name",
          k: "siteName"
        }),
        h(mkrow, {
          onChange: self.handleMkRowChange,
          valueResolver: self.mkRowValueResolver,
          label: "Alert Email",
          k: "alertEmail"
        }),
        mkDropdownRow("Low Alarm", "lowThresholdAlertEna", [
          { value: 0, title: "Disable" },
          { value: 1, title: "Enable" }
        ]),
        h(mkrow, {
          onChange: self.handleMkRowChange,
          valueResolver: self.mkRowValueResolver,
          label: "Low Threshold %",
          k: "lowThreshold"
        }),
        mkDropdownRow("Empty Alarm", "emptyThresholdAlertEna", [
          { value: 0, title: "Disable" },
          { value: 1, title: "Enable" }
        ]),
        h(mkrow, {
          onChange: self.handleMkRowChange,
          valueResolver: self.mkRowValueResolver,
          label: "Empty Threshold %",
          k: "emptyThreshold"
        }),
        h(mkrow, {
          onChange: self.handleMkRowChange,
          valueResolver: self.mkRowValueResolver,
          label: "Ports",
          k: "portCount",
          extraProps: { disabled: true }
        }),
        h(mkrow, {
          onChange: self.handleMkRowChange,
          valueResolver: self.mkRowValueResolver,
          label: "Hardware",
          k: "hwRev",
          extraProps: { disabled: true }
        }),
        h(mkrow, {
          onChange: self.handleMkRowChange,
          valueResolver: self.mkRowValueResolver,
          label: "Firmware",
          k: "fwRev",
          extraProps: { disabled: true }
        }),
        h(mkrow, {
          onChange: self.handleMkRowChange,
          valueResolver: self.mkRowValueResolver,
          label: "Serial Number",
          k: "chipID",
          extraProps: { disabled: true }
        }),
        h(mkrow, {
          onChange: self.handleMkRowChange,
          valueResolver: self.mkRowValueResolver,
          label: "Model",
          k: "modelNum",
          extraProps: { disabled: true }
        }),
        mkDropdownRow("Display Units", "displayUnits", [
          { value: 0, title: "US Customary" },
          { value: 1, title: "Metric" }
        ]),
        mkDropdownRow("Cleaning Mode", "cleanEna", [
          { value: 0, title: "Disable" },
          { value: 1, title: "Enable" }
        ]),
        mkDropdownRow("Beacon Mode", "beaconEna", [
          { value: 0, title: "Disable" },
          { value: 1, title: "Enable" }
        ]),
        mkDropdownRow(
          "Auto Keg Reset",
          "autoCounterRstEna",
          [
            { value: 0, title: "Disable" },
            { value: 1, title: "Enable" }
          ],
          self.onAutoKegReset
        ),
        h(
          AlertModal,
          {
            open: self.state.autoKegResetAlertOpen,
            onClose: self.closeAutoKegResetModal
          },
          "For best Auto Keg Reset performance, " +
            "ensure Reset Keg Volume is applied when the first keg is tapped." +
            " Calibrating your tap is also recommended."
        ),
        //
        portconfigs,
        //
        h(App.SpinButton, {
          class: "btn-block btn-primary mt-5",
          title: "Save Configuration",
          icon: "fa-save",
          onClick: function() {
            var url =
              App.settings.mdashURL +
              "/api/v2/m/device?access_token=" +
              encodeURIComponent(state.pubkey);
            var data = {
              shadow: {
                state: { desired: { config: removeUnNecessaryProps(state.c) } }
              }
            };

            return axios({ method: "POST", url: url, data: data })
              .then(function(res) {
                // If we've updated site name, refresh UI
                if (state.c.siteName) {
                  // console.log('new site name:', state.c.siteName);
                  preactRouter.route(
                    "/config/" +
                      state.c.siteName +
                      "/" +
                      props.id +
                      "/" +
                      props.port
                  );
                  props.name = state.c.siteName;
                  self.componentDidMount();
                }
                setTimeout(props.app.refresh, 750);
              })
              .catch(function() {});
          }
        })
      )
    );
  };
};

App.Content = function(props) {
  return h(
    preactRouter.Router,
    {
      history: History.createHashHistory(),
      onChange: function(ev) {
        props.app.setState({ url: ev.url });
      }
    },
    h(App.PageSites, { app: props.app, default: true }),
    h(App.PageAddDevice, { app: props.app, path: "/add" }),
    h(App.PageAccount, { app: props.app, path: "/account" }),
    h(App.PageSite, { app: props.app, path: "/sites/:name" }),
    h(App.PageSettings, { app: props.app, path: "/config/:name/:id/:port" }),
    h(App.PageKeg, { app: props.app, path: "/sites/:name/:id/:port" })
  );
};

App.Main = function(props) {
  var self = this;

  self.refresh = function() {
    return axios
      .get(
        App.settings.mdashURL + "/customer?access_token=" + self.state.u.token
      )
      .then(function(res) {
        var devices = {},
          pubkeys = res.data.pubkeys || {};
        var keys = Object.keys(pubkeys);
        var pending = keys.map(function(k) {
          var url =
            App.settings.mdashURL +
            "/api/v2/m/device?access_token=" +
            encodeURIComponent(k);
          return axios({ method: "GET", url: url })
            .then(function(res) {
              devices[k] = res.data;
            })
            .catch(function() {});
        });
        return Promise.all(pending).then(function() {
          self.setState({ devices: devices });
        });
      });
  };

  self.logout = function() {
    delete localStorage.ktok;
    self.setState({ u: null });
    return Promise.resolve();
  };

  self.login = function(u) {
    self.setState({ u: u });
    if (u && u.token) localStorage.ktok = u.token;
    // Strip credentials from the URL
    if (location.href.indexOf("?") > 0) {
      location.href = location.href.replace(/\?.*/, "");
    }
    return self.refresh();
  };

  self.componentDidMount = function() {
    window.app = self;
    self.state.refresh = false;
    self.state.devices = {};

    setInterval(function() {
      if (self.state.refresh) self.refresh();
    }, 3000);

    // Figure out access token.
    // mDash registration calls us with ?creds=USER:PASS
    // Add device page cass us with ?access_token=ACCESS_TOKEN
    // And, access_token could be saved locally in localStorage.

    var opts = {},
      access_token = "";
    var m = location.href.match(/\?(\w+)=(.+)$/);
    if (m && m[1] == "creds" && m[2]) {
      // We're called with ?creds=USER:PASS. Set up basic auth
      opts.headers = {
        Authorization: "Basic " + btoa(decodeURIComponent(m[2]))
      };
    } else if (m && m[1] == "access_token" && m[2]) {
      access_token = m[2];
    }
    if (!access_token) access_token = localStorage.ktok;
    var qs = access_token ? "?access_token=" + access_token : "";

    if (opts.headers || qs) {
      self.setState({ loading: true });
      return axios
        .get(App.settings.mdashURL + "/customer" + qs, opts)
        .then(function(res) {
          return self.login(res.data);
        })
        .catch(function(e) {})
        .then(function() {
          self.setState({ loading: false });
        });
    }
  };

  var p = { app: self };
  if (self.state.loading) return h("div"); // Show blank page when loading
  if (!self.state.u) return h(App.Login, p); // Show login unless logged
  return h(
    "div",
    {
      class: "main border",
      style:
        "margin: 0 auto; " +
        "min-height: 100%; max-height: 100%;" +
        "display:grid;grid-template-rows: auto 1fr auto;" +
        "grid-template-columns: 100%;"
    },
    h(App.Header, p),
    h(App.Content, p),
    h(App.Footer, p)
  );
};

window.onload = function() {
  preact.render(h(App.Main), document.body);

  if ("serviceWorker" in navigator)
    // for PWA
    navigator.serviceWorker
      .register("js/service-worker.js")
      .catch(function(err) {});
};
