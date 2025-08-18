import { io } from "socket.io-client";

// Tạo singleton socket connection
let socket;

// Khởi tạo socket connection
export const initSocket = () => {
  if (!socket) {
    socket = io(process.env.REACT_APP_API_URL || "http://localhost:3001", {
      withCredentials: true,
      autoConnect: false,
      transports: ['websocket', 'polling'],
    });
    
    console.log("Socket initialized");
  }
  return socket;
};

// Kết nối socket
export const connectSocket = () => {
  const socket = initSocket();
  if (!socket.connected) {
    socket.connect();
    console.log("Socket connected");
  }
  return socket;
};

// Ngắt kết nối socket
export const disconnectSocket = () => {
  if (socket && socket.connected) {
    socket.disconnect();
    console.log("Socket disconnected");
  }
};

// Tham gia phòng admin
export const joinAdminRoom = () => {
  const socket = initSocket();
  socket.emit('join-admin-room');
  console.log("Joined admin room");
};

// Tham gia phòng user
export const joinUserRoom = (userId) => {
  if (!userId) return;
  
  const socket = initSocket();
  socket.emit('join-user-room', userId);
  console.log(`Joined user room: ${userId}`);
};

// Lắng nghe thông báo
export const listenToNotifications = (callback) => {
  const socket = initSocket();
  socket.on('notification', (data) => {
    console.log("Received notification:", data);
    callback(data);
  });
};

// Xóa listener khi không cần thiết nữa
export const removeNotificationListener = () => {
  if (socket) {
    socket.off('notification');
    console.log("Removed notification listener");
  }
};

export default {
  initSocket,
  connectSocket,
  disconnectSocket,
  joinAdminRoom,
  joinUserRoom,
  listenToNotifications,
  removeNotificationListener,
};