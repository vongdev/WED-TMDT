import images from '../../assets/images';

const NotFoundPage = () => {
    return (
        <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img style={{ width: '70%', height: '70%' }} src={images.pageNotFound} alt="" />
        </div>
    );
};

export default NotFoundPage;
