<template>
  <div class="wrapper">
    <image :src="webImage" class="webImage"></image>
    <image :src="localImage" class="localImage"></image>
    <text class="greeting">Hello！</text>
  </div>
</template>

<script>
import getPackImage from "./helper/image";
export default {
  name: "App",
  data() {
    return {
      webImage: "https://cn.vuejs.org/images/logo.png",
      localImage:getPackImage('1.png')
    };
  }
};
</script>

<style scoped>
.wrapper {
  justify-content: center;
  align-items: center;
}
.webImage {
  width: 200px;
  height: 200px;
  margin-bottom: 50px;
}
.localImage {
  width: 320px;
  height: 151px;
}
.greeting {
  text-align: center;
  margin-top: 70px;
  font-size: 50px;
  color: #41b883;
}
</style>
