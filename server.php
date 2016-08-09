<?php

if ($_POST['request'] == 'listRoms') {
  echo json_encode(ls_dir('roms'));

} else if ($_POST['request'] == 'listSaves') {
  $saves = ls_dir('saves');
  $game = $_POST['gameName'];
  $relevant_saves = [];
  foreach ($saves as $key => $save) {
    if (substr($save, strpos($save, '|') + 1) == $game) {
      $relevant_saves[] = substr($save, 0, strpos($save, '|'));
    }
  }
  echo json_encode($relevant_saves);

} else if ($_POST['request'] == 'createSave') {
  try {
    $filepath = 'saves/' . $_POST['savename'] . '|' . $_POST['rom'];
    file_put_contents($filepath, $_POST['savedata']);
    echo 'true';
  } catch (Exception $e) {
    echo 'false';
  }
}

/**
 * Returns a sorted list of the files in the given directory
 */
function ls_dir($path) {
  $dh  = opendir($path);
  while (false !== ($filename = readdir($dh))) {
    $files[] = $filename;
  }
  sort($files);
  // Remove . and ..
  array_shift($files);
  array_shift($files);
  return $files;
}

?>