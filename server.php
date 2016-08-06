<?php

if ($_POST['request'] == 'listRoms') {
  $dir = 'roms';
  $dh  = opendir($dir);
  while (false !== ($filename = readdir($dh))) {
    $files[] = $filename;
  }
  sort($files);
  // Remove ., ..
  array_shift($files);
  array_shift($files);
  echo json_encode($files);

} else if ($_POST['request'] == 'getRom') {
  echo base64_encode(file_get_contents(__DIR__ . '/roms/' . basename($_POST['romName'])));
}

?>