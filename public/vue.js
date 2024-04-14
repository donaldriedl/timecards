var app = new Vue({
    el: '#app',
    data: {
		// Page Views
        currentPage: "login",
		managerView: "home",
		alerts: [],

		// Punch In/Out
		currentDate: "",
		currentTime: "",
		punchedIn: false,

		// Employee Data
		employeeList: [],
		activeEmployees: [],
		selectedEmployee: {},
		selectedTimecard: {},

		// Inputs
		loginEmployeeId: "",
		loginPassword: "",
		employeeFirstName: "",
		employeeLastName: "",
		employeeId: "",
		employeePayRate: "",
		employeePassword: "",
		employeeSupervisor: false,
		timecardDate: "",
		timecardStart: "",
		timecardEnd: ""
    },

    methods: {
		addEmployee: function() {
			let errors = this.employeeErrorCheck();

			if(errors.length > 0) {
				this.createAlerts(errors);
			} else {
				var data = "firstName=" + encodeURIComponent(this.employeeFirstName) + "&lastName=" + encodeURIComponent(this.employeeLastName) + "&employeeID=" +
					encodeURIComponent(this.employeeId) + "&payRate=" + encodeURIComponent(this.employeePayRate) + "&plainPassword=" + 
					encodeURIComponent(this.employeePassword) + "&supervisor=" + encodeURIComponent(this.employeeSupervisor);
				
				fetch("https://totally-real-authentication.herokuapp.com/employees", {
					method: "POST",
					headers: {
						"Content-Type": "application/x-www-form-urlencoded"
					},
					body: data

				}).then((response) => {
					if(response.status == 201) {
						this.changeView('home');
						this.clearEmployeeInputs();
						this.updateEmployeeList();
					} else if(response.status == 403) {
						this.createAlerts(["You do not have access to do that."]);	
					} else if(response.status == 400) {
						this.createAlerts(["Duplicate User ID, User IDs must be unique."]);
					} else {
						this.createAlerts(["Unknown error"]);
					}
				});	
			}
		},

		addTimecard: function() {
			var data = "date=" + encodeURIComponent(this.timecardDate) + "&startTime=" + encodeURIComponent(this.timecardStart) + "&endTime=" + encodeURIComponent(this.timecardEnd);

			fetch("https://totally-real-authentication.herokuapp.com/" + this.selectedEmployee._id, {
				method: "PUT",
				headers: {
					"Content-Type": "application/x-www-form-urlencoded"
				},
				body: data,
				credentials: "include"

			}).then((response) => {
				if(response.status == 201) {
					this.changeView('existingEmployee');
					this.updateEmployeeList();
				} else if(response.status == 403) {
					this.createAlerts(["You do not have access to do that."]);
				}
			});
		},

		changePage: function(targetPage) {
			this.alerts = [];
			this.currentPage = targetPage;
		},

		changeView: function(targetView) {
			this.alerts = [];
			this.managerView = targetView;
		},

		clearEmployeeInputs: function() {
			this.employeeFirstName = "";
			this.employeeLastName = "";
			this.employeeId = "";
			this.employeePayRate = "";
			this.employeePassword = "";
			this.supervisor = false;
			this.changeView('home');
		},

		clearTimecardInputs: function() {
			this.timecardDate = "";
			this.timecardStart = "";
			this.timecardEnd = "";
		},

		createAlerts: function(alerts) {
			this.alerts = [];
			for(let i = 0; i < alerts.length; i++) {
				this.alerts.push(alerts[i]);
			}
		},

		createTimecard: function() {
			var errors = this.timecardErrorCheck();

			if(errors.length > 0) {
				this.createAlerts(errors);
			} else {
				var data = "date=" + encodeURIComponent(this.timecardDate) + "&startTime=" + encodeURIComponent(this.timecardStart) + "&endTime=" + encodeURIComponent(this.timecardEnd);

				fetch("https://totally-real-authentication.herokuapp.com/timecards/" + this.selectedEmployee._id, {
					method: "POST",
					headers: {
						"Content-Type": "application/x-www-form-urlencoded"
					},
					body: data,
					credentials: "include"

				}).then((response) => {
					if(response.status == 201) {
						this.clearTimecardInputs();
						this.updateEmployeeList();
						setTimeout(this.updateSelectedEmployee, 1000);
					} else if(response.status == 403) {
						this.createAlerts(["You do not have access to do that."]);
					}
				});
			}
		},

		deleteEmployee: function() {
			fetch("https://totally-real-authentication.herokuapp.com/employees/" + this.selectedEmployee._id, {
				method: "DELETE",
				credentials: "include"
			}).then((response) => {
				if(response.status == 200) {
					this.changeView('home');
					this.clearEmployeeInputs();
					setTimeout(this.updateEmployeeList(), 500);
				} else if(response.status == 403) {
					this.createAlerts(["You do not have access to do that."]);
				}
			});

		},

		deleteSession: function() {
			fetch("https://totally-real-authentication.herokuapp.com/logout", {
				method: "POST",
				credentials: "include"
			}).then((response) => {
				this.changePage("login");
				this.employeeList = [];
				this.selectedEmployee = {};
				this.selectedTimecard = {};
			})
		},

		deleteTimecard: function() {
			var data = "date=" + encodeURIComponent(this.timecardDate);

			fetch("https://totally-real-authentication.herokuapp.com/timecards/" + this.selectedEmployee._id, {
				method: "DELETE",
				headers: {
					"Content-Type": "application/x-www-form-urlencoded"
				},
				body: data,
				credentials: "include"

			}).then((response) => {
				if(response.status == 200) {
					this.changeView('existingEmployee');
					this.updateEmployeeList();
					setTimeout(this.updateSelectedEmployee, 500);
				} else if(response.status == 403) {
					this.createAlerts(["You do not have access to do that."]);
				}
			});
		},

		employeeErrorCheck: function() {
			var errors = [];
			if(this.employeeFirstName.length < 1) { errors.push("You must provide a First Name"); }
			if(this.employeeLastName.length < 1) { errors.push("You must provide a Last Name"); }
			if(this.employeeId.length < 1) { errors.push("You must provide an Employee ID"); }
			if(this.employeePayRate.length < 1) { errors.push("You must provide a Pay Rate"); }
			return errors;
		},

		employeePunchIn: function() {
			const data = "id=" + encodeURIComponent(this.selectedEmployee.id) + "&startDate=" + encodeURIComponent(this.currentDate) + "&startTime=" + encodeURIComponent(this.currentTime);

			fetch("https://totally-real-authentication.herokuapp.com/activities", {
				method: "POST",
				headers: {
					"Content-Type": "application/x-www-form-urlencoded"
				},
				body: data

			}).then((response) => {
				this.isActive(this.selectedEmployee);
				this.getActiveEmployees();
			});
		},

		employeePunchOut: function() {
			this.updateTime();
			this.timecardEnd = this.currentTime;
			fetch("https://totally-real-authentication.herokuapp.com/activities/" + this.selectedEmployee.id, {
				method: "DELETE",
			}).then((response) => {
				response.json().then((dataFromServer) => {
					this.timecardDate = dataFromServer.startDate;
					this.timecardStart = dataFromServer.startTime;
					this.createTimecard();
					this.isActive(this.selectedEmployee);
					this.getActiveEmployees();
				})
			})
		},

		employeePunchOutByManager: function(employeeId) {
			this.updateTime();
			this.timecardEnd = this.currentTime;
			for(let i = 0; i < this.employeeList.length; i++) {
				if(employeeId == this.employeeList[i].id) {
					this.selectEmployee(this.employeeList[i]);
				}
			}

			fetch("https://totally-real-authentication.herokuapp.com/activities/" + employeeId, {
				method: "DELETE",
			}).then((response) => {
				response.json().then((dataFromServer) => {
					this.timecardDate = dataFromServer.startDate;
					this.timecardStart = dataFromServer.startTime;
					this.createTimecard();
					this.getActiveEmployees();
				})
			})
		},

		getActiveEmployees: function() {
			this.activeEmployees = [];
			fetch("https://totally-real-authentication.herokuapp.com/activities").then((response) => {
				response.json().then((dataFromServer) => {
					for(let i = 0; i < dataFromServer.length; i++) {
						for(let j = 0; j < this.employeeList.length; j++) {
							if(dataFromServer[i].id == this.employeeList[j].id) {
								this.activeEmployees.push({
									id: dataFromServer[i].id,
									name: this.employeeList[j].lName + ", " + this.employeeList[j].fName,
									startTime: dataFromServer[i].startTime
								});
							}
						}
					}
				})
			})
		},

		getUserType: function(employeeId) {
			fetch("https://totally-real-authentication.herokuapp.com/employees/" + employeeId, {
				credentials: "include"
			}).then((response) => {
				response.json().then((user) => {
					this.selectEmployee(user);
					this.updateTime();

					if(this.selectedEmployee.supervisor == true) { // Is a supervisor
						this.changePage("manager");
						this.changeView("home");
						this.updateEmployeeList();
						this.clearEmployeeInputs();
					} else { // Is not a supervisor
						this.isActive(user);
						this.changePage("employee");
					}
				})
			})		
		},

		getSession: function() {
			fetch("https://totally-real-authentication.herokuapp.com/session", {
				method: "GET",
				credentials: "include"
			}).then((response) => {
				if(response.status != 401) {
					response.json().then((user) => {
						this.getUserType(user.id);
					})
				}
			})
		},

		isActive: function(employeeObject) {
			fetch("https://totally-real-authentication.herokuapp.com/activities/" + employeeObject.id).then((response) => {
				response.json().then((dataFromServer) => {
					this.punchedIn = dataFromServer.isActive;
				})
			});
		},

		selectEmployee: function(selectedEmployee) {
			this.selectedEmployee = selectedEmployee;
			this.employeeFirstName = selectedEmployee.fName;
			this.employeeLastName = selectedEmployee.lName;
			this.employeeId = selectedEmployee.id;
			this.employeePayRate = selectedEmployee.payRate;
			this.employeeSupervisor = selectedEmployee.supervisor;
		},

		updateEmployeeInfo: function() {
			let errors = this.employeeErrorCheck();

			if(errors.length > 0) {
				this.createAlerts(errors);
			} else {
				var data = "firstName=" + encodeURIComponent(this.employeeFirstName) + "&lastName=" + encodeURIComponent(this.employeeLastName) + "&employeeID=" +
					encodeURIComponent(this.employeeId) + "&payRate=" + encodeURIComponent(this.employeePayRate) + "&plainPassword=" + 
					encodeURIComponent(this.employeePassword) + "&supervisor=" + encodeURIComponent(this.employeeSupervisor);

				fetch("https://totally-real-authentication.herokuapp.com/employees/" + this.selectedEmployee._id, {
					method: "PUT",
					headers: {
						"Content-Type": "application/x-www-form-urlencoded"
					},
					body: data,
					credentials: "include"

				}).then((response) => {
					if(response.status == 200) {
						this.changeView('home');
						this.clearEmployeeInputs();
						this.updateEmployeeList();
					} else if(response.status == 403) {
						this.createAlerts(["You do not have access to do that."]);
					}
				});
			}
		},

		updateEmployeeList: function() {
			fetch("https://totally-real-authentication.herokuapp.com/employees", {
				method: "GET",
				credentials: "include"
			}).then((response) => {
				if(response.status == 200) {
					response.json().then((dataFromServer) => {
						this.employeeList = dataFromServer;

						// Sort Last Name / First Name
						this.employeeList = this.employeeList.sort((a, b) => {
							if(a.lName > b.lName) {
								return 1;
							} else if(a.lName == b.lName) {
								if(a.fName > b.fName) {
									return 1;
								} else {
									return -1;
								}
							} else {
								return -1;
							}
						});
						this.getActiveEmployees();
					});
				} else if(response.status == 403) {
					this.createAlerts(["You do not have access to do that."]);
				}
			});
		},

		updateSelectedEmployee: function() {
			var updatedEmployee = this.employeeList.find(employee => {
				return employee.id === this.selectedEmployee.id
			});

			this.selectedEmployee = updatedEmployee;
		},

		updateTime: function() {
			todayDate = new Date();
			let month = todayDate.getMonth() + 1;
			let day = todayDate.getDate();
			let year = todayDate.getFullYear();
			let hour = todayDate.getHours();
			let minutes = todayDate.getMinutes();

			if(day < 10) {
				day = "0" + day;
			}
			
			if(month < 10) {
				month = "0" + month;
			}

			this.currentDate = (year + "-" + month + "-" + day);

			if(minutes < 10) {
				minutes = "0" + minutes;
			}

			this.currentTime = (hour + ":" + minutes);
		},

		updateTimecard: function() {
			var errors = this.timecardErrorCheck();

			if(errors.length > 0) {
				this.createAlerts(errors);
			} else {
				var data = "date=" + encodeURIComponent(this.timecardDate) + "&startTime=" + encodeURIComponent(this.timecardStart) + "&endTime=" + encodeURIComponent(this.timecardEnd);

				fetch("https://totally-real-authentication.herokuapp.com/timecards/" + this.selectedEmployee._id, {
					method: "PUT",
					headers: {
						"Content-Type": "application/x-www-form-urlencoded"
					},
					body: data,
					credentials: "include"

				}).then((response) => {
					if(response.status == 200) {
						this.changeView('existingEmployee');
						this.updateEmployeeList();
						setTimeout(this.updateSelectedEmployee, 500);
					} else if(response.status == 403) {
					this.createAlerts(["You do not have access to do that."]);
				}
				});
			}
		},

		userLogin: function() {
			let errors = this.userLoginErrorCheck();
			if(errors.length > 0) {
				this.createAlerts(errors);
			} else {
				const data = "id=" + encodeURIComponent(this.loginEmployeeId) + "&plainPassword=" + encodeURIComponent(this.loginPassword);

				fetch("https://totally-real-authentication.herokuapp.com/session" , {
					method: "POST",
					headers: {
						"Content-Type": "application/x-www-form-urlencoded"
					},
					body: data

				}).then((response) => {
					if(response.status == 201) { // Username and Password are correct
						this.getUserType(this.loginEmployeeId);
						this.loginEmployeeId = "";
						this.loginPassword = "";
					} else { // Username or Password is incorrect
						this.createAlerts(["Employee ID or Password incorrect"]);
					}
				});
			}
		},

		userLoginErrorCheck() {
			let errors = [];
			if(this.loginEmployeeId.length < 1 || this.loginPassword.length < 1) {
				if(this.loginEmployeeId.length < 1) {
					errors.push("You must provide an Employee ID");
				} 
				if(this.loginPassword.length < 1) {
					errors.push("You must provide a password");
				}
			}
			return errors;
		},

		selectTimecard: function(timecard) {
			this.selectedTimecard = timecard;
			this.timecardDate = timecard.date;
			this.timecardStart = timecard.startTime;
			this.timecardEnd = timecard.endTime;

			this.changeView("existingTimecard");
		},

		timecardErrorCheck: function() {
			var errors = [];
			if(this.timecardDate.length < 1) { errors.push("You must provide a Date"); }
			if(this.timecardStart.length < 1) { errors.push("You must provide a Start Time"); }
			if(this.timecardEnd.length < 1) { errors.push("You must provide an End Time"); }
			return errors;
		}
    },

    created: function() {
		console.log("App is loaded and ready.");
		this.getSession();
	}
});