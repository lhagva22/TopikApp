import { Image, View } from "react-native";
import { CardHeader, CardTitle } from "./card";

const CardTitleWithIcon = ({ icon, image, title, iconBgColor, description }: any) => (
  <View style={{ flexDirection: "row", alignItems: "flex-start", marginBottom: 12 }}>
    <View style={{ width: "15%", alignItems: "center" }}>
      <View
        style={{
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: iconBgColor || "#95caff",
          padding: 5,
          borderRadius: 10,
          width: 40,
          height: 40,
        }}
      >
        {icon ? icon : image ? <Image source={image} style={{width: 25, height: 25}} /> : null}
      </View>
    </View>

    <View style={{ width: "85%", paddingLeft: 10 }}>
      <CardHeader variant="small">{title}</CardHeader>
      <CardTitle>{description}</CardTitle>
    </View>
  </View>
);

export default CardTitleWithIcon;
