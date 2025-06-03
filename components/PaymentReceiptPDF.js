// components/PaymentReceiptPDF.jsx
import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";

// Styles (you can tweak colors and fonts here)
const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 12,
    fontFamily: "Helvetica",
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 20,
    width: "100%",
  },
  logo: {
    width: "auto",
    height: 30,
  },
  section: {
    marginBottom: 15,
  },
  label: {
    fontWeight: "bold",
    marginBottom: 4,
  },
  text: {
    marginBottom: 6,
  },
  table: {
    display: "table",
    width: "auto",
    borderStyle: "solid",
    borderWidth: 1,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    marginTop: 15,
  },
  tableRow: {
    flexDirection: "row",
  },
  tableColHeader: {
    width: "50%",
    borderStyle: "solid",
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    backgroundColor: "#eee",
    padding: 5,
    fontWeight: "bold",
  },
  tableCol: {
    width: "50%",
    borderStyle: "solid",
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    padding: 5,
  },
});

const PaymentReceiptPDF = ({ data }) => (
  <Document>
    <Page style={styles.page}>
      <View style={styles.header}>
        <Image style={styles.logo} src="/images/logo_nav_white.png" alt="" />
      </View>

      <View style={styles.section}>
        <Text style={styles.text}>
          <Text style={styles.label}>Transaction Date: </Text>
          {data.transactionDate}
        </Text>
        <Text style={styles.text}>
          <Text style={styles.label}>Transaction ID: </Text>
          {data.transactionId}
        </Text>
        <Text style={styles.text}>
          <Text style={styles.label}>Network: </Text>
          {data.transactionNetwork}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>FROM:</Text>
        <Text style={styles.text}>{data.from.name}</Text>
        <Text style={styles.text}>{data.from.address}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>TO:</Text>
        <Text style={styles.text}>{data.to.name}</Text>
        <Text style={styles.text}>{data.to.address}</Text>
      </View>

      <View style={styles.table}>
        <View style={styles.tableRow}>
          <Text style={styles.tableColHeader}>Description</Text>
          <Text style={styles.tableColHeader}>Amount (USD)</Text>
        </View>
        {data.items.map((item, i) => (
          <View key={i} style={styles.tableRow}>
            <Text style={styles.tableCol}>{item.description}</Text>
            <Text style={styles.tableCol}>{item.amount.toFixed(2)}</Text>
          </View>
        ))}
        <View style={styles.tableRow}>
          <Text style={[styles.tableCol, { fontWeight: "bold" }]}>Total</Text>
          <Text style={[styles.tableCol, { fontWeight: "bold" }]}>
            {data.total.toFixed(2)}
          </Text>
        </View>
      </View>

      <View style={{ marginTop: 20 }}>
        <Text style={styles.label}>Wallet Address:</Text>
        <Text style={styles.text}>{data.paymentDetails.walletAddress}</Text>
      </View>
    </Page>
  </Document>
);

export default PaymentReceiptPDF;
