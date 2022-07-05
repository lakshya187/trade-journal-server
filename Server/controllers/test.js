// const data = await Options.aggregate([
//     {
//       $facet: {
//         overView: [
//           {
//             $match: {
//               user: req.user._id,
//             },
//           },
//           {
//             $group: {
//               _id: "Stats",
//               totalTrades: {
//                 $sum: 1,
//               },
//               netPLDay: {
//                 $sum: {
//                   $cond: [
//                     {
//                       $gte: ["$tradeCreatedOn", day],
//                     },

//                     {
//                       $sum: "$netProfitLoss",
//                     },
//                     null,
//                   ],
//                 },
//               },
//               netPLWeek: {
//                 $sum: {
//                   $cond: [
//                     {
//                       $gte: ["$tradeCreatedOn", week],
//                     },

//                     { $sum: "$netProfitLoss" },
//                     null,
//                   ],
//                 },
//               },
//               netPLMonth: {
//                 $sum: {
//                   $cond: [
//                     {
//                       $gte: ["$tradeCreatedOn", month],
//                     },
//                     {
//                       $sum: "$netProfitLoss",
//                     },
//                     null,
//                   ],
//                 },
//               },
//               netPLSixMonths: {
//                 $sum: {
//                   $cond: [
//                     {
//                       $gte: ["$tradeCreatedOn", halfYearly],
//                     },
//                     {
//                       $sum: "$netProfitLoss",
//                     },
//                     null,
//                   ],
//                 },
//               },
//               netPLInTotal: { $sum: "$netProfitLoss" },
//             },
//           },
//         ],
//         averageHoldingPeriod: [
//           {
//             $match: {
//               user: req.user._id,
//             },
//           },
//           {
//             $unwind: "$leg",
//           },
//           {
//             $project: {
//               heldDays: {
//                 $round: [
//                   {
//                     $divide: [
//                       { $subtract: ["$leg.closeDate", "$leg.openDate"] },
//                       1000 * 60 * 60 * 24,
//                     ],
//                   },
//                   0,
//                 ],
//               },
//               profitLoss: "$leg.profitLoss",
//             },
//           },
//           // {
//           //   $group: {
//           //     _id: "Average Holding Period",
//           //     value: { $avg: "$heldDays" },
//           //   },
//           // },
//         ],
//       },
//     },
//   ]);
//   res.status(200).json({
//     message: "sucess",
//     data,
//   });
// } catch (e) {
//   console.log(e);
//   res.status(400).json({
//     status: "failed",
//     message: e,
//   });
// }
// };
