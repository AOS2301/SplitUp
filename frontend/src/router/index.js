import { createRouter, createWebHistory } from "vue-router";
import Home from "../views/Home.vue";
import Login from "../views/login.vue";
import Register from "../views/register.vue";
import { supabase } from "../lib/supabase";

const routes = [
  {
    path: "/",
    component: Home,
  },
  {
    path: "/login",
    component: Login,
    meta: { somenteVisitante: true },
  },
  {
    path: "/register",
    component: Register,
    meta: { somenteVisitante: true },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach(async (to) => {
  if (!to.meta.exigeLogin && !to.meta.somenteVisitante) return true;

  const { data } = await supabase.auth.getSession();
  const logado = data.session !== null;

  if (to.meta.exigeLogin && !logado) return "/login";
  if (to.meta.somenteVisitante && logado) return "/";

  return true;
});

export default router;
