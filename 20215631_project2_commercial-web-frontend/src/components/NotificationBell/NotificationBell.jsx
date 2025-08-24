import { useEffect, useState } from "react";
import { Badge, Popover, List } from "antd";
import { BellOutlined } from "@ant-design/icons";
import { listenToNotifications, removeNotificationListener, joinAdminRoom, joinUserRoom, connectSocket } from "../../socket"; // đường dẫn đúng tới socket.js
import { useSelector } from "react-redux";

const NotificationBell = ({ isAdmin }) => {
  const user = useSelector(state => state.user);
  const [notifications, setNotifications] = useState([]);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    connectSocket();

    if (isAdmin) {
      joinAdminRoom();
    } else if (user?.id) {
      joinUserRoom(user.id);
    }

    // Lắng nghe thông báo
    listenToNotifications((data) => {
      setNotifications(prev => [{...data, time: new Date()}, ...prev]);
    });

    return () => removeNotificationListener();
  }, [user, isAdmin]);

  const content = (
    <List
      size="small"
      dataSource={notifications}
      renderItem={item => (
        <List.Item>
          <span style={{ fontWeight: 600 }}>{item.type === "order" ? "Đơn hàng" : "Khác"}:</span>
          <span style={{ marginLeft: 8 }}>{item.message || JSON.stringify(item.data)}</span>
          <span style={{ marginLeft: 12, fontSize: "0.9em", color: "#888" }}>
            {item.time ? new Date(item.time).toLocaleTimeString() : ""}
          </span>
        </List.Item>
      )}
      locale={{ emptyText: "Không có thông báo mới" }}
    />
  );

  return (
    <Popover content={content} trigger="click" placement="bottomRight" open={visible} onOpenChange={setVisible}>
      <Badge count={notifications.length} overflowCount={9} offset={[0, 6]}>
        <BellOutlined style={{ fontSize: 24, cursor: "pointer" }} />
      </Badge>
    </Popover>
  );
};

export default NotificationBell;