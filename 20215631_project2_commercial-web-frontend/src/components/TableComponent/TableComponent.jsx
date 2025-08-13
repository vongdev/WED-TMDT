import { Dropdown, Space, Table } from 'antd';
import Loading from '../LoadingComponent/Loading';
import { useState } from 'react';
import { Excel } from 'antd-table-saveas-excel';
import classNames from 'classnames/bind';
import styles from './TableComponent.module.scss';

const cx = classNames.bind(styles);

const TableComponent = (props) => {
    const [rowSelectedKeys, setRowSelectedKeys] = useState([]);
    const {
        selectionType = 'checkbox',
        data = [],
        columns = [],
        columnsExport = [],
        isLoading = false,
        handleDeleteMany,
        tableRef,
    } = props;

    const rowSelection = {
        onChange: (selectedRowKeys, selectedRows) => {
            setRowSelectedKeys(selectedRowKeys);
        },
    };

    const handleDeleteAll = () => {
        handleDeleteMany(rowSelectedKeys);
    };

    // const handleExportExcel = () => {
    //     const excel = new Excel();
    //     excel
    //         .addSheet('test')
    //         .addColumns(columnsExport)
    //         .addDataSource(data, {
    //             str2Percent: true,
    //         })
    //         .saveAs('Excel.xlsx');
    // };

    const handleExportExcel = () => {
        // Chuyển đổi dữ liệu trước khi xuất ra Excel
        const formattedData = data.map((record) => ({
            ...record,
            isDelivered: record.isDelivered ? 'Đã vận chuyển' : 'Chưa vận chuyển',
            isPaid: record.isPaid ? 'Đã thanh toán' : 'Chưa thanh toán',
        }));

        const excel = new Excel();
        excel
            .addSheet('test')
            .addColumns(columnsExport)
            .addDataSource(formattedData, {
                str2Percent: true,
            })
            .saveAs('Excel.xlsx');
    };

    return (
        <div>
            <Loading isLoading={isLoading}>
                {rowSelectedKeys.length > 0 && (
                    <div className={cx('delete-all-btn')} onClick={handleDeleteAll}>
                        Xóa tất cả
                    </div>
                )}

                <button className={cx('export-excel-btn')} onClick={handleExportExcel}>
                    <p>Xuất file Excel</p>
                </button>

                <Table
                    ref={tableRef}
                    rowSelection={{
                        type: selectionType,
                        ...rowSelection,
                    }}
                    columns={columns}
                    dataSource={data}
                    {...props}
                />
            </Loading>
        </div>
    );
};

export default TableComponent;
