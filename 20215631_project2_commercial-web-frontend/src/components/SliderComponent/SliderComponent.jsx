import Slider from 'react-slick';
import { Image } from 'antd';

const SliderComponent = ({ arrImage }) => {
    const settings = {
        dots: true,
        infinite: true,
        speed: 500,
        slidesToShow: 1,
        slidesToScroll: 1,
        autoplay: true,
        autoplaySpeed: 3000,
    };
    return (
        <Slider {...settings}>
            {arrImage.map((image) => {
                return <Image key={image} src={image} alt="img" width="100%" height="350px" preview={false} />;
            })}
        </Slider>
    );
};

export default SliderComponent;
