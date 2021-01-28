(this["webpackJsonpthree-js-3D-sample"] =
  this["webpackJsonpthree-js-3D-sample"] || []).push([
  [0],
  {
    39: function (e, t, n) {},
    40: function (e, t, n) {},
    45: function (e, t, n) {
      "use strict";
      n.r(t);
      var a = n(9),
        i = n(1),
        r = n.n(i),
        c = n(29),
        s = n.n(c),
        o = (n(39), n(2)),
        j = n(3),
        l = n(4),
        u = n(5),
        g = (n(40), n(13)),
        b = n(6),
        h = n(47),
        p = n(46),
        d = n(0);
      function m(e) {
        var t = Object(i.useRef)(),
          n = Object(h.a)(
            "/three-js-3d-sample/vanguard_t_choonyung@Walking.glb"
          ),
          r = n.nodes,
          c = n.materials,
          s = n.animations,
          o = Object(p.a)(s, t),
          j = o.actions,
          l = o.mixer;
        Object(i.useEffect)(function () {
          (l.timeScale = 0.8), j["mixamo.com"].play();
        });
        var u = new d.TextureLoader().load("grass.jpg");
        (u.wrapS = d.RepeatWrapping),
          (u.wrapT = d.RepeatWrapping),
          u.repeat.set(4, 4);
        var g = new d.Mesh(
          new d.PlaneGeometry(1e3, 1e3),
          new d.MeshPhongMaterial({ color: 10066329, depthWrite: !1 })
        );
        return (
          (g.rotation.x = -Math.PI / 2),
          (g.receiveShadow = !0),
          (g.texture = u),
          Object(a.jsxs)(
            "group",
            Object(b.a)(
              Object(b.a)({ ref: t }, e),
              {},
              {
                dispose: null,
                scale: [0.01, 0.01, 0.01],
                children: [
                  Object(a.jsx)("primitive", { object: r.mixamorigHips }),
                  Object(a.jsx)("skinnedMesh", {
                    material: c.Vanguard_VisorMat,
                    geometry: r.vanguard_visor.geometry,
                    skeleton: r.vanguard_visor.skeleton,
                  }),
                  Object(a.jsx)("skinnedMesh", {
                    material: c.VanguardBodyMat,
                    geometry: r.vanguard_Mesh.geometry,
                    skeleton: r.vanguard_Mesh.skeleton,
                  }),
                  Object(a.jsx)("primitive", { object: g }),
                ],
              }
            )
          )
        );
      }
      h.a.preload("/three-js-3d-sample/vanguard_t_choonyung@Walking.glb");
      var O = n(48),
        v = (function (e) {
          Object(l.a)(n, e);
          var t = Object(u.a)(n);
          function n() {
            return Object(o.a)(this, n), t.apply(this, arguments);
          }
          return (
            Object(j.a)(n, [
              {
                key: "render",
                value: function () {
                  return Object(a.jsx)("div", {
                    className: "App",
                    children: Object(a.jsxs)(g.a, {
                      camera: { position: [-2, 2, 2] },
                      children: [
                        Object(a.jsx)(O.a, {}),
                        Object(a.jsx)("ambientLight", { intensity: 1 }),
                        Object(a.jsx)("spotLight", { position: [10, 100, 10] }),
                        Object(a.jsx)(i.Suspense, {
                          fallback: null,
                          children: Object(a.jsx)(m, {}),
                        }),
                      ],
                    }),
                  });
                },
              },
            ]),
            n
          );
        })(i.Component),
        x = function (e) {
          e &&
            e instanceof Function &&
            n
              .e(3)
              .then(n.bind(null, 49))
              .then(function (t) {
                var n = t.getCLS,
                  a = t.getFID,
                  i = t.getFCP,
                  r = t.getLCP,
                  c = t.getTTFB;
                n(e), a(e), i(e), r(e), c(e);
              });
        };
      s.a.render(
        Object(a.jsx)(r.a.StrictMode, { children: Object(a.jsx)(v, {}) }),
        document.getElementById("root")
      ),
        x();
    },
  },
  [[45, 1, 2]],
]);
//# sourceMappingURL=main.f438affe.chunk.js.map
