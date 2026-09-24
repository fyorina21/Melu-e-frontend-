const fs = require('fs');
let c = fs.readFileSync('src/screens/systemadmin/StaffAccountManagementScreen.tsx', 'utf8');

c = c.replace(
  '  return (\n    <View style={styles.linkingCard}>\n      <View style={styles.linkingHeader}>\n        <View style={{ flex: 1 }}>\n          <Text style={typography.h2}>Teacher-Student Linking</Text>',
  '  return (\n    <Modal visible={true} transparent animationType=\"slide\" onRequestClose={onClose}>\n      <View style={styles.overlay}>\n        <View style={[styles.modalSheet, { maxHeight: \'90%\' }]}>\n      <View style={styles.linkingHeader}>\n        <View style={{ flex: 1 }}>\n          <Text style={typography.h2}>Teacher-Student Linking</Text>'
);

c = c.replace(
  '      </Modal>\n    </View>\n  );\n}\n\nexport default function StaffAccountManagementScreen',
  '      </Modal>\n        </View>\n      </View>\n    </Modal>\n  );\n}\n\nexport default function StaffAccountManagementScreen'
);

fs.writeFileSync('src/screens/systemadmin/StaffAccountManagementScreen.tsx', c);
