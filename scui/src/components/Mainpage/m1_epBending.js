import { useState, useContext, useEffect, forwardRef } from "react";
import axios from "axios";
import moment from "moment";
import { NavLink, useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";

import { AccessContext } from "../../constant/accessContext";

import { TickGif } from "../../commonjs/HilightRule";
import KeyboardDoubleArrowLeftIcon from "@mui/icons-material/KeyboardDoubleArrowLeft";
import KeyboardDoubleArrowRightIcon from "@mui/icons-material/KeyboardDoubleArrowRight";

import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import {
	Dialog,
	Button,
	Container,
	Card,
	CardContent,
	Typography,
	Stack,
	Checkbox,
	DialogTitle,
	DialogActions,
	ImageList,
	ImageListItem,
	Box,
} from "@mui/material";
import Slide from "@mui/material/Slide";

import OrderViewModal from "../modals/OrderViewModal";
import ModuleTools from "../modals/ModuleTools";
import {
	handleFindCoverDetailLookup_arr,
	handleFindLookup_arr,
} from "../../commonjs/CommonFun";

import {
	getLookupData,
	setOrderGeneric,
	getImagesOnly,
	getOrderAllLakVal,
} from "../../constant/url";
import { IOSSwitch } from "../../commonjs/TableFunc";
import CommentBoxModal from "../modals/CommentBoxModal";
import { handleGenericUpdateRow } from "../../commonjs/CommonApi";

const Transition = forwardRef(function Transition(props, ref) {
	return <Slide direction="up" ref={ref} {...props} />;
});
export default function M1epBending() {
	const navigate = useNavigate();
	const access = useContext(AccessContext).authID;
	const [orderList, setOrderList] = useState([]);
	const [selectedRowId, setSelectedRowId] = useState(0);
	const [selComment, setSelComment] = useState("");
	const [imageBase64, setImageBase64] = useState([]);
	const [lookUpList, setLookupList] = useState([]);
	const [openStatusCnf, setOpenStatusCnf] = useState(false);
	const [openImgDialog, setOpenImgDialog] = useState(false);
	const [animeShow, setAnimeShow] = useState(false);

	const [openCommentDialog, setOpenCommentDialog] = useState(false);
	const [openOrderView, setOpenOrderView] = useState(false);

	const handleClickOpenStatus = (rowId) => {
		setSelectedRowId(rowId);
		setOpenStatusCnf(true);
	};

	const handleCloseStatus = (response) => {
		if (response === "yes") {
			handleNested(selectedRowId, {
				target: { name: "bending_status", checked: true },
			});
		}
		setOpenStatusCnf(false);
	};

	const handleCloseImg = (response) => {
		setOpenImgDialog(false);
	};

	const handleOrderList = () => {
		var bodyFormData = new FormData();
		bodyFormData.append("authId", access);
		bodyFormData.append("pageType", "endPlateBending");
		axios({
			method: "post",
			url: getOrderAllLakVal,
			data: bodyFormData,
			headers: { "Content-Type": "multipart/form-data" },
		})
			.then(function (response) {
				//handle success
				const res_data = response.data;
				if (res_data.status_code === 101) {
					toast("Api Authentication failed. login again.");
				} else if (res_data.status_code === 200) {
					const ret_data_cd = res_data.data_orders;
					setOrderList(ret_data_cd);
					toast("Order Retrieved");
				} else {
					console.log(res_data.status_msg);
				}
			})
			.catch(function (response) {
				//handle error
				console.log(response);
			});
	};

	const handleNested = (rowId, e) => {
		const { name, checked } = e.target;

		var idx = orderList.findIndex((item) => item.id === rowId);
		if (name === "cnc_nesting_status") {
			if (orderList.at(idx).cnc_nesting_pgm_no.trim().length === 0) {
				toast(
					"Please update CNC Nesting Number Before updating status.",
					"warning"
				);
				return;
			}
			if (orderList.at(idx).cnc_nested !== "true") {
				toast("Please check CNC Nesting Before updating status.", "warning");
				return;
			}
		}
		console.log(
			"open status",
			rowId,
			orderList.findIndex((item) => item.id === rowId)
		);
		var editData;
		if (name.includes("status")) {
			editData = orderList.filter((itemA) => rowId !== itemA.id);
		} else {
			editData = orderList.map((item) =>
				item.id === rowId && name ? { ...item, [name]: String(checked) } : item
			);
		}

		console.log(editData);
		setOrderList(editData);
		handleGenericUpdate(rowId, name, String(checked));
	};

	const handleEPComments = (rowId, rowValue) => {
		handleGenericUpdate(rowId, "ep_comments", rowValue);
		const editData = orderList.map((item) =>
			item.id === rowId ? { ...item, ["ep_comments"]: rowValue } : item
		);
		setOrderList(editData);
	};

	const handleGenericUpdate = async (rowid, field, value) => {
		var bodyFormData = new FormData();
		bodyFormData.append("authId", access);
		bodyFormData.append("id", rowid);
		bodyFormData.append(field, value);
		axios({
			method: "post",
			url: setOrderGeneric,
			data: bodyFormData,
			headers: { "Content-Type": "multipart/form-data" },
		})
			.then(function (response) {
				//handle success
				const res_data = response.data;
				if (res_data.status_code === 200) {
					toast(res_data.status_msg, "success");
					handleOrderList(access);
					if (field.includes("status")) {
						setAnimeShow(true);
						const timeId = setTimeout(() => {
							// After 3 seconds set the show value to false
							setAnimeShow(false);
						}, 4000);

						return () => {
							clearTimeout(timeId);
						};
					}

					//return data
				} else {
					toast(res_data.status_msg, "error");
					return false;
				}
			})
			.catch(function (response) {
				//handle error
				console.log(response);
			});
	};

	function handleGetLookup() {
		var bodyFormData = new FormData();
		bodyFormData.append("authId", access);

		axios({
			method: "post",
			url: getLookupData,
			data: bodyFormData,
			headers: { "Content-Type": "multipart/form-data" },
		})
			.then(function (response) {
				//handle success
				const res_data = response.data;
				if (res_data.status_code === 200) {
					setLookupList(res_data);
				} else {
					toast(res_data.status_msg, "error");
				}
			})
			.catch(function (response) {
				//handle error
				console.log(response);
			});
	}

	function handleGetImagebyId(epid, assemblyid, brazingid) {
		var bodyFormData = new FormData();
		bodyFormData.append("authId", access);
		bodyFormData.append("epImg", epid);
		bodyFormData.append("assemblyImg", assemblyid);
		bodyFormData.append("brazingImg", brazingid);

		axios({
			method: "post",
			url: getImagesOnly,
			data: bodyFormData,
			headers: { "Content-Type": "multipart/form-data" },
		})
			.then(function (response) {
				//handle success
				const res_data = response.data;
				if (res_data.status_code === 200) {
					setImageBase64(res_data["data_orders"]);
				} else {
					toast(res_data.status_msg, "error");
				}
			})
			.catch(function (response) {
				//handle error
				console.log(response);
			});
	}

	const handleEpDateTime = (rowId, e) => {
		const { name, checked } = e.target;
		const date = new Date();
		const data_val = checked ? moment(date).format("DD MMM YY H:mm") : "";
		const editData = orderList.map((item) =>
			item.id === rowId && name ? { ...item, [name]: data_val } : item
		);

		handleGenericUpdate(rowId, name, data_val);
		setOrderList(editData);
	};

	const refreshData = (request) => {
		if (request) {
			handleOrderList(access);
		}
	};

	useEffect(() => {
		handleGetLookup();
		handleOrderList(access);
	}, []);

	const columns = [
		{
			field: "order_id",
			headerName: "Order No",
			maxWidth: 70,
			renderCell: (params) => {
				return (
					<Button
						fullWidth
						onClick={() => {
							setSelectedRowId(params.row.id);
							setOpenOrderView(true);
						}}
						color="info"
						className="toolButton-grid "
					>
						{params.row.order_id}{" "}
					</Button>
				);
			},
			flex: 1,
		},
		{
			field: "full_customer_name",
			headerName: "Customer Name",
			minWidth: 90,
			flex: 1,
		},
		{
			field: "size",
			headerName: "Size",
			minWidth: 120,
			flex: 1,
		},
		{
			field: "end_plate_orientation",
			headerName: "LH/RH",
			valueGetter: (params) => {
				return handleFindLookup_arr(
					lookUpList,
					"oreientation",
					params.row.end_plate_orientation
				);
			},
			maxWidth: 70,
			flex: 1,
		},
		{
			field: "end_plate_modal",
			headerName: "EP Model",
			minWidth: 150,
			renderCell: (params) => {
				return (
					<Button
						fullWidth
						onClick={() => {
							setImageBase64("");
							setOpenImgDialog(true);
							handleGetImagebyId("N/A", params.row.assembly_Photo, "N/A");
						}}
						color="info"
						className="toolButton-grid "
					>
						{params.row.end_plate_modal}
					</Button>
				);
			},
			flex: 1,
		},
		{
			field: "cover_detail",
			headerName: "Cover Details",
			valueGetter: (params) => {
				return handleFindCoverDetailLookup_arr(
					lookUpList,
					params.row.cover_detail
				);
			},
			minWidth: 150,
			flex: 1,
		},
		{
			field: "ep_comments",
			headerName: "EP Comments",
			// renderCell: (params) => {
			// 	return (
			// 		<Button
			// 			onClick={() => {
			// 				setSelectedRowId(params.row.id);
			// 				setSelComment(params.row.ep_comments);
			// 				setOpenCommentDialog(true);
			// 			}}
			// 			color="info"
			// 			className="toolButton-grid bg-light"
			// 		>
			// 			{params.row.ep_comments.substring(0, 20)}
			// 		</Button>
			// 	);
			// },
			editable: true,
			minWidth: 150,
			flex: 1,
		},
		{
			field: "ep_DateTime",
			headerName: "End Plate",
			renderCell: (params) => {
				return (
					<Checkbox
						checked={moment(params.row.ep_DateTime, "DD MMM YY H:mm").isValid()}
						sx={{ m: 1 }}
						name="ep_DateTime"
						onChange={(e) => handleEpDateTime(params.row.id, e)}
					/>
				);
			},
			maxWidth: 100,
			flex: 1,
		},
		{
			field: "bending_status",
			headerName: "Status",
			renderCell: (params) => {
				return (
					<IOSSwitch
						checked={params.row.bending_status === "true" ? true : false}
						sx={{ m: 1 }}
						name="bending_status"
						onChange={(e) => {
							handleClickOpenStatus(params.row.id);
						}}
					></IOSSwitch>
				);
			},
			maxWidth: 60,
			flex: 1,
		},
	];

	return (
		<Box>
			<ToastContainer />
			<TickGif show={animeShow} />
			<Card>
				<CardContent>
					<Stack direction={"row"} spacing={4}>
						<Typography
							gutterBottom
							variant="h5"
							component="div"
							className="mt-2"
						>
							End Plate Bending
						</Typography>
						<ModuleTools
							pageName="endPlateBending"
							OrderData={orderList}
							refreshPage={(request) => refreshData(request)}
						/>
						<div style={{ border: "1px solid grey" }}></div>
						<NavLink to="/cncpunching" className="toolButton">
							<KeyboardDoubleArrowLeftIcon style={{ color: "#BC1921" }} />
							Prev Module
						</NavLink>
						<NavLink to="/tubecutting" className="toolButton">
							Next Module
							<KeyboardDoubleArrowRightIcon style={{ color: "#BC1921" }} />
						</NavLink>
					</Stack>
					<div className="mt-3">
						<DataGrid
							slots={{ toolbar: GridToolbar }}
							getRowClassName={(params) => {
								if (params.indexRelativeToCurrentPage % 2 === 0) {
									return params.row.priority === "true"
										? "Mui-even secon-bg"
										: "Mui-even";
								} else {
									return params.row.priority === "true"
										? "Mui-odd secon-bg"
										: "Mui-odd";
								}
							}}
							sx={{
								"& .MuiDataGrid-columnHeader": {
									backgroundColor: "#943612",
									color: "white",
								},
								".MuiDataGrid-row.Mui-odd ": {
									backgroundColor: "#FFE1D6",
								},
								".MuiDataGrid-row.Mui-even ": {
									backgroundColor: "#F2F2F2",
								},
								".MuiDataGrid-row:not(.MuiDataGrid-row--dynamicHeight)>.MuiDataGrid-cell":
									{
										overflow: "visible !important",
										whiteSpace: "break-spaces",
										padding: 0,
										display: "flex",
										justifyContent: "center",
										fontSize: "0.75rem",
									},
								".MuiDataGrid-columnHeaderTitleContainer": {
									display: "flex",
									justifyContent: "center",
									fontSize: "0.75rem",
								},
								"& .MuiDataGrid-columnHeader, .MuiDataGrid-cell": {
									border: ".5px solid white",
								},
								"& .MuiInputBase-input": {
									fontSize: "0.74rem",
									padding: "16.5px 1px ",
								},
							}}
							processRowUpdate={(param, event) => {
								handleGenericUpdateRow(
									access,
									["ep_comments", "cnc_nesting_pgm_no"],
									param
								).then((pStatus) => {
									console.log(pStatus);
								});
								return param;
							}}
							onProcessRowUpdateError={(param) => {
								console.log(param);
							}}
							rowHeight={50}
							columns={columns}
							rows={orderList}
							editMode="row"
						/>
					</div>
				</CardContent>
			</Card>

			<Dialog
				open={openCommentDialog}
				TransitionComponent={Transition}
				keepMounted
				onClose={() => setOpenCommentDialog(false)}
				key={Math.random(1, 100)}
			>
				<CommentBoxModal
					content={selComment}
					retContent={(e) => {
						handleEPComments(selectedRowId, e);
						setOpenCommentDialog(false);
					}}
				/>
			</Dialog>

			<Dialog
				open={openOrderView}
				TransitionComponent={Transition}
				keepMounted
				onClose={() => setOpenOrderView(false)}
				key={Math.random(1, 100)}
			>
				<OrderViewModal orderId={selectedRowId} key={Math.random(1, 100)} />
			</Dialog>

			<Dialog
				open={openStatusCnf}
				TransitionComponent={Transition}
				keepMounted
				onClose={handleCloseStatus}
				aria-describedby="alert-dialog-slide-description"
			>
				<DialogTitle>
					{"Do you want to mark the status complete of the order?"}
				</DialogTitle>
				<DialogActions>
					<Button onClick={() => handleCloseStatus("no")}>No</Button>
					<Button onClick={() => handleCloseStatus("yes")}>Yes</Button>
				</DialogActions>
			</Dialog>

			<Dialog
				open={openImgDialog}
				TransitionComponent={Transition}
				keepMounted
				onClose={handleCloseImg}
				aria-describedby="alert-dialog-slide-description"
				fullWidth
				maxWidth="lg"
				style={{ padding: "5px" }}
			>
				<Stack>
					{/* <>
						{imageBase64.ep_photo?.length > 0 ? (
							<DialogTitle>End Plate Images</DialogTitle>
						) : (
							""
						)}
						{
							<ImageList cols={1} rowHeight={500}>
								{imageBase64.ep_photo?.map((item, index) => (
									<ImageListItem key={"epphoto" + index}>
										<img
											src={item}
											srcSet={item}
											alt={"Assembly"}
											loading="lazy"
										/>
									</ImageListItem>
								))}
							</ImageList>
						}
					</> */}
					<>
						{imageBase64.assembly_Photo?.length > 0 ? (
							<DialogTitle>Assembly Images</DialogTitle>
						) : (
							""
						)}

						{
							<ImageList cols={1}>
								{imageBase64.assembly_Photo?.map((item, index) => (
									<ImageListItem key={"assembly" + index}>
										<img
											src={item}
											srcSet={item}
											alt={"Assembly"}
											loading="lazy"
										/>
									</ImageListItem>
								))}
							</ImageList>
						}
					</>
					{/* <>
						{imageBase64.brazing_Photo?.length > 0 ? (
							<DialogTitle>Brazing Images</DialogTitle>
						) : (
							""
						)}

						{
							<ImageList cols={1} >
								{imageBase64.brazing_Photo?.map((item, index) => (
									<ImageListItem key={"brazing" + index}>
										<img
											src={item}
											srcSet={item}
											alt={"Assembly"}
											loading="lazy"
										/>
									</ImageListItem>
								))}
							</ImageList>
						}
					</> */}
				</Stack>
				<DialogActions>
					<Button onClick={() => handleCloseImg("yes")}>Close</Button>
				</DialogActions>
			</Dialog>
		</Box>
	);
}
