(this.webpackJsonphappyfox=this.webpackJsonphappyfox||[]).push([[0],{56:function(e,t,r){},57:function(e,t,r){},95:function(e,t,r){"use strict";r.r(t);var s=r(1),n=r(22),c=r.n(n),a=(r(56),r(57),r(3)),i=r(4),o=r(6),l=r(5),d=r(8),u=r(26),j=r(7),p=r(15),h=r(9),b="GET_TICKETS",m="GET_TICKET",x="CLEAR_TICKET_VIEW",O="FETCH_TICKETS",v={tickets:[],ticket:null},f=Object(p.c)({ticketsReducer:function(){var e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:v,t=arguments.length>1?arguments[1]:void 0;switch(t.type){case O:return Object(h.a)(Object(h.a)({},e),{},{tickets:t.tickets});case b:return e;case m:console.log(e);var r=e.tickets.find((function(e){return e.id===t.id}));return Object(h.a)(Object(h.a)({},e),{},{ticket:r});case x:return Object(h.a)(Object(h.a)({},e),{},{ticket:null});default:return e}}}),g=Object(p.e)(f,window.__REDUX_DEVTOOLS_EXTENSION__&&window.__REDUX_DEVTOOLS_EXTENSION__()),w=r(16),k=r.n(w),y=r(24),N=r(25),C=r.n(N),L=r(17),M=r(18),T=r(19),S=r(20),I={base_url:"",status:[{id:0,name:"New",color:"#7c9235",color2:"yellow-300"},{id:1,name:"Open",color:"#4a3bb3",color2:"blue-300"},{id:2,name:"On Hold",color:"#d44444",color2:"red-300"},{id:3,name:"Solved",color:"#812192",color2:"indigo-300"},{id:4,name:"Closed",color:"#717171",color2:"green-300"}],priority:[{id:1,name:"Low",color:"green-600"},{id:2,name:"Medium",color:"blue-600"},{id:3,name:"High",color:"yellow-600"},{id:4,name:"Critical",color:"red-600"}],category:[{id:1,name:"Billing & Return",color:"black"},{id:2,name:"Marketing",color:"black"},{id:3,name:"Sales",color:"black"},{id:4,name:"Support",color:"black"}]},B=function(e){return{type:m,id:e}},_=function(e){return{type:O,tickets:e}},z=r(0),W=function(e){Object(o.a)(r,e);var t=Object(l.a)(r);function r(){var e;Object(a.a)(this,r);for(var s=arguments.length,n=new Array(s),c=0;c<s;c++)n[c]=arguments[c];return(e=t.call.apply(t,[this].concat(n))).state={open:!1,value:e.props.value},e}return Object(i.a)(r,[{key:"render",value:function(){var e=this,t=this.props,r=t.list;t.value;return Object(z.jsxs)("div",{className:"relative  w-1/5",children:[Object(z.jsx)("div",{onClick:function(){return e.setState({open:!e.state.open})},className:"mx-3 h-12 cursor-pointer flex items-center",children:Object(z.jsxs)("div",{className:"flex flex-col leading-none",children:[Object(z.jsx)("span",{className:"text-xs",children:this.props.type}),Object(z.jsx)("span",{className:"text-md font-bold text-".concat(r[this.state.value].color),children:r[this.state.value].name})]})}),Object(z.jsx)("div",{className:"".concat(this.state.open?"":"hidden"," absolute bg-white top-12 left-3 w-60 rounded shadow-xl mt-2 z-10"),children:Object(z.jsx)("ul",{className:"divide-y divide-gray-400",children:r.map((function(t,r){return Object(z.jsx)("li",{children:Object(z.jsx)("a",{href:"#",className:"my-2 mx-2 flex",onClick:function(){return e.setState({user:r,open:!1})},children:Object(z.jsx)("span",{children:t.name})})},r)}))})})]})}}]),r}(s.Component),E=function(e){Object(T.a)(r,e);var t=Object(S.a)(r);function r(){var e;Object(L.a)(this,r);for(var s=arguments.length,n=new Array(s),c=0;c<s;c++)n[c]=arguments[c];return(e=t.call.apply(t,[this].concat(n))).state={star:e.props.star},e}return Object(M.a)(r,[{key:"render",value:function(){var e=this;return Object(z.jsx)("button",{className:"px-3 h-12 outline-none focus:outline-none",onClick:function(){return e.setState({star:!e.state.star})},children:this.state.star?Object(z.jsx)("svg",{className:"w-6 text-yellow-500",xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 20 20",fill:"currentColor",children:Object(z.jsx)("path",{d:"M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"})}):Object(z.jsx)("svg",{className:"w-6",xmlns:"http://www.w3.org/2000/svg",fill:"none",viewBox:"0 0 24 24",stroke:"currentColor",children:Object(z.jsx)("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:"2",d:"M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"})})})}}]),r}(s.Component),R=function(e){Object(o.a)(r,e);var t=Object(l.a)(r);function r(){var e;Object(a.a)(this,r);for(var s=arguments.length,n=new Array(s),c=0;c<s;c++)n[c]=arguments[c];return(e=t.call.apply(t,[this].concat(n))).state={open:!1,user:e.props.user||0},e.user=[{name:"Santhosh"},{name:"Kumar"},{name:"Sankar"},{name:"Dass"},{name:"John"},{name:"David"}],e}return Object(i.a)(r,[{key:"componentDidUpdate",value:function(e){this.props.user!==e.user&&this.setState({user:this.props.user})}},{key:"render",value:function(){var e=this;return Object(z.jsxs)("div",{className:"relative",children:[Object(z.jsxs)("div",{onClick:function(){return e.setState({open:!e.state.open})},className:"mx-3 h-10 cursor-pointer flex items-center",children:[Object(z.jsx)("img",{src:"/user.png",alt:"user",className:"w-6 h-6 mr-2"}),Object(z.jsxs)("div",{className:"flex flex-col leading-none",children:[Object(z.jsx)("span",{className:"text-xs",children:this.props.type}),Object(z.jsx)("span",{className:"text-md",children:this.user[this.state.user].name})]})]}),Object(z.jsx)("div",{className:"".concat(this.state.open?"":"hidden"," absolute bg-white top-10 left-3 w-60 rounded shadow-xl mt-1 z-10"),children:Object(z.jsx)("ul",{className:"divide-y divide-gray-400",children:this.user.map((function(t,r){return Object(z.jsx)("li",{children:Object(z.jsxs)("a",{href:"#",className:"my-2 mx-2 flex",onClick:function(){return e.setState({user:r,open:!1})},children:[e.props.img?Object(z.jsx)("img",{src:"/user.png",alt:"user",className:"w-5 h-5 mr-2"}):"",Object(z.jsx)("span",{className:"text-sm",children:t.name})]})},r)}))})})]})}}]),r}(s.Component),A=function(e){Object(o.a)(r,e);var t=Object(l.a)(r);function r(){return Object(a.a)(this,r),t.apply(this,arguments)}return Object(i.a)(r,[{key:"render",value:function(){var e=this,t=this.props.ticket;return Object(z.jsx)("div",{className:"relative mb-5",children:Object(z.jsxs)("div",{className:" bg-white ml-10 rounded-lg border-2 hover:border-blue-600 h-full shadow-xl",children:[Object(z.jsxs)("div",{className:"h-20 flex relative cursor-pointer",onClick:function(){return console.log("View Ticket",e.props.viewTicket(t.id))},children:[Object(z.jsx)("span",{className:"absolute right-0 top-0 mr-3 mt-3",children:Object(z.jsx)("svg",{className:"w-4",xmlns:"http://www.w3.org/2000/svg",fill:"none",viewBox:"0 0 24 24",stroke:"currentColor",children:Object(z.jsx)("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:"2",d:"M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"})})}),Object(z.jsxs)("div",{className:"w-36 flex flex-col mr-3 my-auto text-center",children:[Object(z.jsx)("span",{className:"text-xs",children:t.id}),Object(z.jsx)("span",{className:"py-1 bg-gray-600 text-white my-1 rounded-r-sm text-sm uppercase",style:{backgroundColor:I.status[t.status].color},children:I.status[t.status].name})]}),Object(z.jsxs)("div",{className:"p-2 my-auto",children:[Object(z.jsxs)("div",{className:"flex items-center",children:[Object(z.jsx)("h4",{className:"text-lg font-bold",children:t.title}),Object(z.jsx)("span",{className:"mx-1",children:"(6)"}),Object(z.jsx)("span",{className:"text-xs",children:"21 hours ago"})]}),Object(z.jsx)("p",{children:t.body})]})]}),Object(z.jsxs)("div",{className:"h-12 bg-gray-100 flex items-center divide-x divide-gray-400 rounded-b-md",children:[Object(z.jsxs)("div",{className:"flex divide-x divide-gray-400 w-min",children:[Object(z.jsx)(E,{star:t.star}),Object(z.jsx)(E,{star:t.star}),Object(z.jsx)("span",{children:Object(z.jsx)("svg",{className:"w-6 mx-3 h-12",xmlns:"http://www.w3.org/2000/svg",fill:"none",viewBox:"0 0 24 24",stroke:"currentColor",children:Object(z.jsx)("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:"2",d:"M8 12h.01M12 12h.01M16 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"})})})]}),Object(z.jsx)(R,{type:"assignee",user:t.assignee}),Object(z.jsx)(R,{type:"raised by",user:t.raised}),Object(z.jsx)(W,{value:t.priority,type:"priority",list:[{name:"Low",color:"green-600"},{name:"Medium",color:"blue-600"},{name:"High",color:"yellow-600"},{name:"Critical",color:"red-600"}]}),Object(z.jsx)(W,{value:t.category,type:"category",list:[{name:"Billing & Return",color:"black"},{name:"Marketing",color:"black"},{name:"Sales",color:"black"},{name:"Support",color:"black"}]}),Object(z.jsx)("div",{})]})]})})}}]),r}(s.Component),D=Object(d.b)(null,(function(e){return{viewTicket:function(t){return e(B(t))}}}))(A),V=function(e){Object(T.a)(r,e);var t=Object(S.a)(r);function r(){return Object(L.a)(this,r),t.apply(this,arguments)}return Object(M.a)(r,[{key:"render",value:function(){var e=this.props.tickets;return Object(z.jsxs)("div",{className:"m-2",children:[Object(z.jsxs)("div",{className:"my-5 ml-10 mr-5 flex justify-between",children:[Object(z.jsx)("h3",{className:"text-2xl",children:"Pending Tickets"}),Object(z.jsxs)("div",{className:"grid grid-flow-col gap-4",children:[Object(z.jsxs)("div",{className:"flex items-center mx-2",children:[Object(z.jsx)("svg",{className:"w-5 mr-1",xmlns:"http://www.w3.org/2000/svg",fill:"none",viewBox:"0 0 24 24",stroke:"currentColor",children:Object(z.jsx)("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:"2",d:"M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"})}),"Last Replied - recent to oldest",Object(z.jsx)("svg",{className:"w-5 ml-1",xmlns:"http://www.w3.org/2000/svg",fill:"none",viewBox:"0 0 24 24",stroke:"currentColor",children:Object(z.jsx)("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:"2",d:"M19 9l-7 7-7-7"})})]}),Object(z.jsxs)("div",{className:"flex items-center",children:[Object(z.jsx)("svg",{className:"w-5 mr-1",xmlns:"http://www.w3.org/2000/svg",fill:"none",viewBox:"0 0 24 24",stroke:"currentColor",children:Object(z.jsx)("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:"2",d:"M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"})}),"Apply Filter",Object(z.jsx)("svg",{className:"w-5 ml-1",xmlns:"http://www.w3.org/2000/svg",fill:"none",viewBox:"0 0 24 24",stroke:"currentColor",children:Object(z.jsx)("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:"2",d:"M19 9l-7 7-7-7"})})]}),Object(z.jsxs)("div",{className:"flex items-center",children:["1 - 10",Object(z.jsx)("svg",{className:"w-5 ml-1",xmlns:"http://www.w3.org/2000/svg",fill:"none",viewBox:"0 0 24 24",stroke:"currentColor",children:Object(z.jsx)("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:"2",d:"M19 9l-7 7-7-7"})})]}),Object(z.jsxs)("div",{children:[Object(z.jsx)("button",{className:"px-1 py-2 bg-gray-100 focus:outline-none",children:Object(z.jsx)("svg",{className:"w-4",xmlns:"http://www.w3.org/2000/svg",fill:"none",viewBox:"0 0 24 24",stroke:"currentColor",children:Object(z.jsx)("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:"2",d:"M15 19l-7-7 7-7"})})}),Object(z.jsx)("button",{className:"px-1 py-2 bg-white focus:outline-none",children:Object(z.jsx)("svg",{className:"w-4",xmlns:"http://www.w3.org/2000/svg",fill:"none",viewBox:"0 0 24 24",stroke:"currentColor",children:Object(z.jsx)("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:"2",d:"M9 5l7 7-7 7"})})})]})]})]}),Object(z.jsx)("div",{className:"mr-4",children:e.map((function(e,t){return Object(z.jsx)(D,{ticket:e},t)}))})]})}}]),r}(s.Component),H=Object(d.b)((function(e){return{tickets:e.ticketsReducer.tickets}}))(V),P=function(e){Object(T.a)(r,e);var t=Object(S.a)(r);function r(){var e;Object(L.a)(this,r);for(var s=arguments.length,n=new Array(s),c=0;c<s;c++)n[c]=arguments[c];return(e=t.call.apply(t,[this].concat(n))).state={open:!1,ticket:null},e}return Object(M.a)(r,[{key:"componentDidUpdate",value:function(e){!this.state.open&&null!==this.props.ticket||null!==this.props.ticket&&e.ticket&&this.props.ticket.id!==e.ticket.id?this.setState({open:!0,ticket:this.props.ticket}):this.state.open&&null===this.props.ticket&&this.setState({open:!1,ticket:null})}},{key:"render",value:function(){var e=this,t=this.state.ticket;return console.log(t),Object(z.jsx)("div",{className:"".concat(this.state.open?"":"hidden"," bg-gray-200 absolute w-3/6 h-screen shadow-2xl right-0 -top-12"),children:Object(z.jsxs)("div",{className:"mt-12 relative",children:[Object(z.jsx)("button",{className:"m-auto p-2 text-white absolute -left-10 w-10 bg-gray-600",onClick:function(){return e.props.closeTicket()},children:Object(z.jsx)("svg",{className:"w-5",xmlns:"http://www.w3.org/2000/svg",fill:"none",viewBox:"0 0 24 24",stroke:"currentColor",children:Object(z.jsx)("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:"2",d:"M6 18L18 6M6 6l12 12"})})}),null===t?Object(z.jsx)("div",{className:"flex justify-center items-center",children:"Loading..."}):Object(z.jsxs)("div",{className:"w-full",children:[Object(z.jsx)("div",{className:"bg-white p-2",children:Object(z.jsx)(R,{user:t.assignee,type:"assignee"})}),Object(z.jsxs)("div",{className:"m-2 shadow-xl rounded bg-gray-100 h-44",children:[Object(z.jsx)("h3",{className:"text-center font-bold mt-2 bg-white p-2 rounded-t",children:t.title}),Object(z.jsx)("p",{className:"m-2",children:t.body})]})]})]})})}}]),r}(s.Component),K=Object(d.b)((function(e){return{ticket:e.ticketsReducer.ticket}}),(function(e){return{closeTicket:function(){return e({type:x})}}}))(P),U=function(e){Object(o.a)(r,e);var t=Object(l.a)(r);function r(){return Object(a.a)(this,r),t.apply(this,arguments)}return Object(i.a)(r,[{key:"componentDidMount",value:function(){var e=Object(y.a)(k.a.mark((function e(){var t;return k.a.wrap((function(e){for(;;)switch(e.prev=e.next){case 0:return e.next=2,C.a.get("/dummy.json");case 2:t=e.sent,this.props.fetchTickets(t.data.tickets);case 4:case"end":return e.stop()}}),e,this)})));return function(){return e.apply(this,arguments)}}()},{key:"render",value:function(){return Object(z.jsxs)("div",{children:[Object(z.jsx)(H,{}),Object(z.jsx)(K,{})]})}}]),r}(s.Component),X=Object(d.b)(null,(function(e){return{fetchTickets:function(t){return e(_(t))}}}))(U),J=r(51),F=r(21),G=function(e){Object(o.a)(r,e);var t=Object(l.a)(r);function r(){return Object(a.a)(this,r),t.apply(this,arguments)}return Object(i.a)(r,[{key:"render",value:function(){var e=this,t=this.props,r=t.group_index,s=t.index;return Object(z.jsx)(F.b,{draggableId:"card:".concat(r,":").concat(s),index:s,type:"card",children:function(t){var r=t.innerRef,s=t.draggableProps,n=t.dragHandleProps;return Object(z.jsxs)("div",Object(h.a)(Object(h.a)(Object(h.a)({},s),n),{},{ref:r,className:"bg-white rounded shadow-md mx-2 z-30 border-b-2 border-".concat(e.props.color),children:[Object(z.jsxs)("div",{className:"p-2 cursor-pointer",onClick:function(){return console.log("View Ticket",e.props.viewTicket(e.props.value.id))},children:[Object(z.jsx)("h3",{className:"text-md",children:e.props.value.title}),Object(z.jsx)("p",{className:"text-xs",children:e.props.value.body})]}),Object(z.jsxs)("div",{className:"bg-gray-100 h-10 rounded-b flex justify-between divide-x divide-gray-400",children:[Object(z.jsx)(R,{type:"assignee",user:e.props.value.assignee}),Object(z.jsx)(R,{type:"raised",user:e.props.value.raised}),Object(z.jsx)("span",{children:Object(z.jsx)("svg",{className:"w-6 mx-3 h-10",xmlns:"http://www.w3.org/2000/svg",fill:"none",viewBox:"0 0 24 24",stroke:"currentColor",children:Object(z.jsx)("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:"2",d:"M8 12h.01M12 12h.01M16 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"})})})]})]}))}})}}]),r}(s.Component),q=Object(d.b)(null,(function(e){return{viewTicket:function(t){return e(B(t))}}}))(G),Q=function(e){Object(o.a)(r,e);var t=Object(l.a)(r);function r(){return Object(a.a)(this,r),t.apply(this,arguments)}return Object(i.a)(r,[{key:"render",value:function(){var e=this,t=this.props.index,r=this.props,s=r.group,n=r.index;return console.log(s),Object(z.jsx)(F.b,{draggableId:"group:".concat(n),index:n,type:"group",children:function(r){var n=r.innerRef,c=r.draggableProps,a=r.dragHandleProps;return Object(z.jsx)("div",Object(h.a)(Object(h.a)(Object(h.a)({},c),a),{},{ref:n,className:"w-96 min-h-full bg-gray-100 rounded shadow-md relative",children:Object(z.jsxs)("div",{className:"w-full h-full grid grid-rows-2",style:{gridTemplateRows:"2.6em 1fr"},children:[Object(z.jsx)("div",{className:"p-2 my-auto",children:Object(z.jsx)("span",{children:s.title})}),Object(z.jsx)("div",{className:"overflow-y-scroll",children:Object(z.jsx)(F.c,{droppableId:"card:".concat(e.props.index),direction:"vertical",type:"card",children:function(e){return Object(z.jsxs)("div",Object(h.a)(Object(h.a)({ref:e.innerRef},e.droppableProps),{},{className:"space-y-2 w-full relative mb-5",children:[s.items.map((function(e,r){return Object(z.jsx)(q,{group_index:t,index:r,value:e,color:s.color},r)})),e.placeholder]}))}})})]})}))}})}}]),r}(s.Component),Y=r(35),Z=r.n(Y),$=function(e){Object(o.a)(r,e);var t=Object(l.a)(r);function r(){var e;Object(a.a)(this,r);for(var s=arguments.length,n=new Array(s),c=0;c<s;c++)n[c]=arguments[c];return(e=t.call.apply(t,[this].concat(n))).state={groups:[]},e}return Object(i.a)(r,[{key:"componentDidMount",value:function(){var e=Object(y.a)(k.a.mark((function e(){var t,r;return k.a.wrap((function(e){for(;;)switch(e.prev=e.next){case 0:return e.next=2,C.a.get("/dummy.json");case 2:t=e.sent,r=[],console.log(t.data.tickets),I.status.map((function(e){r[e.id]={title:e.name,color:e.color2,items:t.data.tickets.filter((function(t){return t.status==e.id}))||[]}})),this.setState({groups:r});case 7:case"end":return e.stop()}}),e,this)})));return function(){return e.apply(this,arguments)}}()},{key:"onDragEnd",value:function(e){var t=e.type,r=e.source,s=e.destination;if(console.log("end",t,r,s),s)if("group"===s.droppableId&&r.droppableId===s.droppableId){var n=Z()(this.state.groups,r.index,s.index);this.setState({groups:n})}else if(r.droppableId===s.droppableId){var c=Z()(this.state.groups[r.droppableId.replace("card:","")].items,r.index,s.index),a=this.state.groups;a[r.droppableId.replace("card:","")].items=c,this.setState({groups:a})}else{var i=function(e,t,r,s){var n=Array.from(e),c=Array.from(t),a=n.splice(r.index,1),i=Object(J.a)(a,1)[0];c.splice(s.index,0,i);var o={};return o[r.droppableId]=n,o[s.droppableId]=c,o}(this.state.groups[r.droppableId.replace("card:","")].items,this.state.groups[s.droppableId.replace("card:","")].items,r,s),o=this.state.groups;o[r.droppableId.replace("card:","")].items=i[r.droppableId],o[s.droppableId.replace("card:","")].items=i[s.droppableId],this.setState({groups:o})}}},{key:"render",value:function(){var e=this;return Object(z.jsxs)("div",{className:"w-full min-h-full absolute grid grid-rows-2",style:{gridTemplateRows:"3em 1fr"},children:[Object(z.jsx)("h3",{className:"text-2xl px-4 my-auto",children:"All Tickets"}),Object(z.jsx)("div",{className:"overflow-x-auto relative",children:Object(z.jsx)(F.a,{onDragEnd:this.onDragEnd.bind(this),children:Object(z.jsx)(F.c,{droppableId:"group",direction:"horizontal",type:"group",children:function(t){var r=t.innerRef,s=t.droppableProps,n=t.placeholder;return Object(z.jsxs)("div",Object(h.a)(Object(h.a)({ref:r},s),{},{className:"flex space-x-4 h-full p-4 absolute",children:[e.state.groups.map((function(e,t){return Object(z.jsx)(Q,{group:e,index:t},t)})),n]}))}})})})]})}}]),r}(s.Component),ee=Object(d.b)((function(e){return{tickets:e.ticketsReducer.tickets}}))($),te=function(e){Object(o.a)(r,e);var t=Object(l.a)(r);function r(){return Object(a.a)(this,r),t.apply(this,arguments)}return Object(i.a)(r,[{key:"componentDidMount",value:function(){var e=Object(y.a)(k.a.mark((function e(){var t;return k.a.wrap((function(e){for(;;)switch(e.prev=e.next){case 0:return e.next=2,C.a.get("/dummy.json");case 2:t=e.sent,this.props.fetchTickets(t.data.tickets);case 4:case"end":return e.stop()}}),e,this)})));return function(){return e.apply(this,arguments)}}()},{key:"render",value:function(){return Object(z.jsxs)("div",{children:[Object(z.jsx)(ee,{}),Object(z.jsx)(K,{})]})}}]),r}(s.Component),re=Object(d.b)(null,(function(e){return{fetchTickets:function(t){return e(_(t))}}}))(te),se=function(e){Object(T.a)(r,e);var t=Object(S.a)(r);function r(){var e;Object(L.a)(this,r);for(var s=arguments.length,n=new Array(s),c=0;c<s;c++)n[c]=arguments[c];return(e=t.call.apply(t,[this].concat(n))).menu=[{name:"Pending Tickets",val:18,url:"/pending-tickets"},{name:"All Tickets",val:21,url:"/all-tickets"},{name:"Unresponded",val:14,url:"/unresponded"},{name:"Due Today",val:"~",url:"/due-today"},{name:"My Tickets",val:14,url:"/my-tickets"},{name:"SLA Breached",val:"~",url:"/sla-breached"},{name:"On Priority",val:4,url:"/on-priority"}],e}return Object(M.a)(r,[{key:"render",value:function(){return Object(z.jsxs)("div",{style:{width:"260px"},className:"w-auto fixed h-full bg-gray-500 text-sm text-white",children:[Object(z.jsxs)("div",{className:"pt-5 pl-7 pr-5 pb-4 flex justify-between",children:[Object(z.jsxs)("div",{className:"flex",children:[Object(z.jsx)("span",{className:"uppercase font-bold mr-1",children:"queues"}),Object(z.jsx)("span",{children:Object(z.jsxs)("svg",{className:"w-5",xmlns:"http://www.w3.org/2000/svg",fill:"none",viewBox:"0 0 24 24",stroke:"currentColor",children:[Object(z.jsx)("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:"2",d:"M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"}),Object(z.jsx)("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:"2",d:"M15 12a3 3 0 11-6 0 3 3 0 016 0z"})]})})]}),Object(z.jsx)("span",{children:Object(z.jsx)("svg",{className:"w-5",xmlns:"http://www.w3.org/2000/svg",fill:"none",viewBox:"0 0 24 24",stroke:"currentColor",children:Object(z.jsx)("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:"2",d:"M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"})})})]}),Object(z.jsx)("ul",{children:this.menu.map((function(e,t){return Object(z.jsx)("li",{children:Object(z.jsxs)(u.b,{to:e.url,activeClassName:"bg-blue-400",className:"flex justify-between hover:bg-blue-400 pr-5 pl-7 py-0.5 rounded-r l-0 my-0.5 mr-5",children:[Object(z.jsx)("span",{children:e.name}),Object(z.jsx)("span",{children:e.val})]})},t)}))})]})}}]),r}(s.Component),ne=r(31),ce=function(e){Object(o.a)(r,e);var t=Object(l.a)(r);function r(){var e;Object(a.a)(this,r);for(var s=arguments.length,n=new Array(s),c=0;c<s;c++)n[c]=arguments[c];return(e=t.call.apply(t,[this].concat(n))).state={open:!1,menu:0},e.menu=[{svg:Object(z.jsx)("svg",{className:"w-8 mr-2",xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 20 20",fill:"currentColor",children:Object(z.jsx)("path",{fillRule:"evenodd",d:"M2 5a2 2 0 012-2h12a2 2 0 012 2v2a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm14 1a1 1 0 11-2 0 1 1 0 012 0zM2 13a2 2 0 012-2h12a2 2 0 012 2v2a2 2 0 01-2 2H4a2 2 0 01-2-2v-2zm14 1a1 1 0 11-2 0 1 1 0 012 0z",clipRule:"evenodd"})}),title:"Ticket",url:"/"},{svg:Object(z.jsx)("svg",{className:"w-8 mr-2",xmlns:"http://www.w3.org/2000/svg",fill:"none",viewBox:"0 0 24 24",stroke:"currentColor",children:Object(z.jsx)("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:"2",d:"M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"})}),title:"Kanboard",url:"/kanboard"}],e}return Object(i.a)(r,[{key:"render",value:function(){var e=this,t=this.state,r=t.open,s=t.menu;return Object(z.jsxs)("div",{className:"relative h-full",children:[Object(z.jsxs)("button",{className:"flex items-center hover:bg-green-700 h-full px-3 cursor-pointer outline-none focus:outline-none ".concat(r?"bg-green-700":""),onClick:function(){return e.setState({open:!e.state.open})},children:[Object(z.jsx)("span",{children:this.menu[s].svg}),Object(z.jsx)("span",{className:"text-xl mr-2",children:this.menu[s].title}),Object(z.jsx)("span",{children:Object(z.jsx)("svg",{className:"h-5 transform duration-200 ease-in-out ".concat(this.state.open?"-rotate-180":""),xmlns:"http://www.w3.org/2000/svg",fill:"none",viewBox:"0 0 24 24",stroke:"currentColor",children:Object(z.jsx)("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:"2",d:"M19 9l-7 7-7-7"})})})]}),Object(z.jsxs)("div",{className:"absolute bg-gray-200 z-20 mt-1 shadow-xl text-gray-500 p-3 rounded flex space-x-6 ".concat(r?"":"hidden"," "),children:[Object(z.jsx)("ul",{className:"py-2",children:this.menu.map((function(t,r){return Object(z.jsx)("li",{className:"py-1",children:Object(z.jsxs)(u.b,{to:t.url,className:"hover:text-gray-800 rounded flex items-center",onClick:function(){return e.setState({menu:r,open:!1})},children:[Object(z.jsx)("span",{children:t.svg}),t.title]})},r)}))}),Object(z.jsx)("ul",{className:"p-2",children:Object(ne.a)(Array(8)).map((function(e,t){return Object(z.jsxs)("li",{className:"py-1 ",children:["Dummy_",t+1]},t)}))}),Object(z.jsx)("ul",{className:"p-2",children:Object(ne.a)(Array(8)).map((function(e,t){return Object(z.jsxs)("li",{className:"py-1 ",children:["Dummy_1_",t+1]},t)}))}),Object(z.jsx)("ul",{className:"p-2",children:Object(ne.a)(Array(8)).map((function(e,t){return Object(z.jsxs)("li",{className:"py-1 ",children:["Dummy_2_",t+1]},t)}))})]})]})}}]),r}(s.Component),ae=function(e){Object(o.a)(r,e);var t=Object(l.a)(r);function r(){return Object(a.a)(this,r),t.apply(this,arguments)}return Object(i.a)(r,[{key:"render",value:function(){return Object(z.jsxs)("div",{className:"flex justify-between items-center mx-3 my-2 my-auto h-full",children:[Object(z.jsx)(ce,{}),Object(z.jsxs)("div",{className:"flex text-white",children:[Object(z.jsxs)("div",{className:"relative mx-auto h-full",children:[Object(z.jsx)("button",{type:"submit",className:"absolute left-0 top-0 mt-4 ml-3",children:Object(z.jsx)("svg",{className:"h-5",xmlns:"http://www.w3.org/2000/svg",fill:"none",viewBox:"0 0 24 24",stroke:"currentColor",children:Object(z.jsx)("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:"2",d:"M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"})})}),Object(z.jsx)("input",{className:" bg-gray-600 h-10 my-1 px-5 pl-10 w-96 rounded text-sm focus:outline-none",type:"search",name:"search",placeholder:"Search"})]}),Object(z.jsx)("button",{className:"p-2 my-auto ml-1 rounded outline-none focus:outline-none bg-gray-600",children:Object(z.jsx)("svg",{className:"h-5",xmlns:"http://www.w3.org/2000/svg",fill:"none",viewBox:"0 0 24 24",stroke:"currentColor",children:Object(z.jsx)("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:"2",d:"M12 6v6m0 0v6m0-6h6m-6 0H6"})})})]}),Object(z.jsxs)("div",{className:"flex items-center",children:[Object(z.jsxs)("div",{className:"flex items-center",children:[Object(z.jsx)("img",{src:"/user.png",alt:"user",className:"w-6 rounded-full"}),Object(z.jsx)("span",{children:Object(z.jsx)("svg",{className:"h-5 mr-3",xmlns:"http://www.w3.org/2000/svg",fill:"none",viewBox:"0 0 24 24",stroke:"currentColor",children:Object(z.jsx)("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:"2",d:"M19 9l-7 7-7-7"})})})]}),Object(z.jsx)("span",{children:Object(z.jsx)("svg",{className:"h-5",xmlns:"http://www.w3.org/2000/svg",fill:"none",viewBox:"0 0 24 24",stroke:"currentColor",children:Object(z.jsx)("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:"2",d:"M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"})})})]})]})}}]),r}(s.Component),ie=function(e){Object(o.a)(r,e);var t=Object(l.a)(r);function r(){return Object(a.a)(this,r),t.apply(this,arguments)}return Object(i.a)(r,[{key:"render",value:function(){var e=this.props.children;return console.log(this),Object(z.jsxs)("div",{className:"grid grid-rows-2 min-h-screen",style:{gridTemplateRows:"3em 1fr"},children:[Object(z.jsx)("div",{className:"h-12 bg-gray-800 text-white fixed w-full z-20",children:Object(z.jsx)(ae,{})}),Object(z.jsxs)("div",{className:"pt-12 grid grid-cols-2 z-10 min-h-screen",style:{gridTemplateColumns:"260px 1fr"},children:[Object(z.jsx)("div",{className:"z-10",children:Object(z.jsx)(se,{})}),Object(z.jsx)("div",{className:"relative z-0",children:e})]})]})}}]),r}(s.Component),oe=function(e){Object(o.a)(r,e);var t=Object(l.a)(r);function r(){return Object(a.a)(this,r),t.apply(this,arguments)}return Object(i.a)(r,[{key:"render",value:function(){return Object(z.jsx)(d.a,{store:g,children:Object(z.jsx)(u.a,{children:Object(z.jsx)(ie,{children:Object(z.jsxs)(j.c,{children:[Object(z.jsx)(j.a,{exact:!0,path:"/",component:X}),Object(z.jsx)(j.a,{exact:!0,path:"/kanboard",component:re})]})})})})}}]),r}(s.Component);c.a.render(Object(z.jsx)(oe,{}),document.getElementById("root"))}},[[95,1,2]]]);
//# sourceMappingURL=main.1996158b.chunk.js.map