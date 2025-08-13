export const isJsonString = (data) => {
    try {
        JSON.parse(data);
    } catch (err) {
        return false;
    }
    return true;
};

export const getBase64 = (file) =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = (error) => reject(error);
    });

export const renderOptions = (arr) => {
    let result = [];
    if (arr) {
        result = arr?.map((opt) => {
            return {
                label: opt,
                value: opt,
            };
        });
    }
    result.push({
        label: 'Thêm loại',
        value: 'add_type',
    });
    return result;
};
